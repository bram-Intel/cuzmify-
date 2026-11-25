import { NextResponse } from 'next/server';
import { FunctionCallingMode, type Part } from '@google/generative-ai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getGeminiClient } from '@/lib/gemini';
import type { ThemeName } from '@/core/project-schema';
import { createDefaultBlueprint, type BusinessBlueprint } from '@/core/blueprint-schema';
import {
  TEMPLATE_ENGINES,
  resolveTemplateEngineId,
  renderTemplateEngine,
} from '@/core/template-engines';
import { toGeminiFunctionDeclarations, executeBlueprintMcpTool } from '@/lib/mcp/cuzmify-tools';
import { inspectRenderedSite } from '@/lib/mcp/site-inspector';

export const maxDuration = 120; // Allow full AI visual synthesis on Vercel/Node

// ── Intent Classifier ─────────────────────────────────────────────────────────
type PromptIntent =
  | 'mcp-tools'         // DEFAULT untargeted path: structured Gemini MCP tool-calling
  | 'element-style'     // Targeted GrapesJS element edit (targetElement provided)
  | 'add-section'       // Append a new HTML section in desktop GrapesJS
  | 'full-transform'    // Restyle full HTML visuals while preserving sections
  | 'full-rebuild';     // Explicit wipe & rebuild (user said so explicitly)

function classifyIntent(prompt: string, hasTarget: boolean): PromptIntent {
  if (hasTarget) return 'element-style';
  const p = prompt.toLowerCase();

  // Pure unconstrained HTML rebuild — only when user explicitly asks
  if (
    (p.includes('redesign') && p.includes('everything')) ||
    p.includes('start fresh') || p.includes('rebuild the site') ||
    p.includes('redo the whole') || p.includes('completely rebuild') ||
    p.includes('full redesign') || p.includes('start over')
  ) return 'full-rebuild';

  // Append-only HTML section for desktop visual canvas
  if (
    p.includes('add a section') || p.includes('insert a section') ||
    p.includes('new section') || p.includes('include a section') ||
    (p.includes('add') && (
      p.includes('testimonial') || p.includes('faq') || p.includes('pricing table') ||
      p.includes('gallery section') || p.includes('contact section') ||
      p.includes('team section') || p.includes('map')
    ))
  ) return 'add-section';

  // Default: Route untargeted edits (copy, packages, prices, templates, WhatsApp, hero cover, niches)
  // through deterministic Cuzmify MCP tools so mobile & desktop share identical live guarantees.
  return 'mcp-tools';
}

function detectTheme(prompt: string, currentTheme: ThemeName): ThemeName {
  const p = prompt.toLowerCase();
  if (p.includes('dark') || p.includes('obsidian') || p.includes('night') || p.includes('black') || p.includes('dark feel')) return 'dark-obsidian';
  if (p.includes('luxury') || p.includes('gold') || p.includes('royal') || p.includes('dubai') || p.includes('opulent')) return 'luxury';
  if (p.includes('minimal') || p.includes('clean') || p.includes('simple') || p.includes('swiss')) return 'minimal';
  if (p.includes('editorial') || p.includes('vogue') || p.includes('fashion') || p.includes('magazine')) return 'editorial';
  if (p.includes('vibrant') || p.includes('pink') || p.includes('playful') || p.includes('gen-z')) return 'vibrant';
  if (p.includes('apple') || p.includes('sleek') || p.includes('tech luxury')) return 'apple-luxury';
  if (p.includes('modern') || p.includes('indigo') || p.includes('contemporary')) return 'modern';
  if (p.includes('light') || p.includes('bram') || p.includes('bright') || p.includes('professional')) return 'bram-light';
  return currentTheme;
}

/** Robust JSON parser with automatic error recovery and regex fallback for AI outputs */
function safeParseAIResponse(rawText: string): any {
  let cleanJson = rawText.trim();
  if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  // 1. Direct standard parse
  try {
    return JSON.parse(cleanJson);
  } catch (err: any) {
    console.warn('[AI Chat] Standard JSON.parse failed, attempting robust recovery:', err?.message);
  }

  // 2. Try closing open quotes and braces
  try {
    let repaired = cleanJson;
    const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      repaired += '"';
    }
    if (!repaired.trim().endsWith('}')) {
      repaired += '}';
    }
    return JSON.parse(repaired);
  } catch {}

  // 3. Robust Regex Extraction Fallback
  const aiReplyMatch = cleanJson.match(/"aiReply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const themeMatch = cleanJson.match(/"theme"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const updatedElemMatch = cleanJson.match(/"updatedElementHtml"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const newSecMatch = cleanJson.match(/"newSectionHtml"\s*:\s*"((?:[^"\\]|\\.)*)"/);

  let updatedHtml: string | null = null;
  const htmlMatch = cleanJson.match(/"updatedHtml"\s*:\s*"([\s\S]*)/);
  if (htmlMatch) {
    let rawHtml = htmlMatch[1];
    rawHtml = rawHtml.replace(/"\s*(?:,\s*"[^"]+"\s*:\s*[\s\S]*|\s*\}\s*)$/, '');
    if (rawHtml.endsWith('"')) rawHtml = rawHtml.slice(0, -1);

    try {
      updatedHtml = JSON.parse(`"${rawHtml}"`);
    } catch {
      updatedHtml = rawHtml
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }

  return {
    aiReply: aiReplyMatch ? aiReplyMatch[1].replace(/\\"/g, '"') : 'Applied requested design transformation.',
    theme: themeMatch ? themeMatch[1] : undefined,
    changesApplied: ['Applied responsive visual styles & layout enhancements'],
    updatedHtml,
    updatedElementHtml: updatedElemMatch ? updatedElemMatch[1].replace(/\\"/g, '"') : null,
    newSectionHtml: newSecMatch ? newSecMatch[1].replace(/\\"/g, '"') : null,
    blueprintUpdates: null,
  };
}

/** Extract the ordered list of sections and their IDs from the current HTML */
function extractSectionManifest(html: string): string {
  const sectionPattern = /<section[^>]*>/gi;
  const sections: string[] = [];
  let match;
  while ((match = sectionPattern.exec(html)) !== null) {
    const tag = match[0];
    const idMatch = tag.match(/id=["']([^"']+)["']/i);
    const classMatch = tag.match(/class=["']([^"']+)["']/i);
    const dataTypeMatch = tag.match(/data-cuzmify-type=["']([^"']+)["']/i);
    const entry = [
      idMatch ? `id="${idMatch[1]}"` : '',
      dataTypeMatch ? `type="${dataTypeMatch[1]}"` : '',
      classMatch ? `classes="${classMatch[1].slice(0, 60)}"` : '',
    ].filter(Boolean).join(', ');
    sections.push(`  ${sections.length + 1}. <section ${entry}>`);
  }
  return sections.join('\n') || '  (no named sections found)';
}

/** Extract all data-cuzmify-* attributes from HTML for the integrity manifest */
function extractCuzmifyAttributes(html: string): string {
  const attrPattern = /data-cuzmify-[a-z-]+="[^"]*"/gi;
  const attrs = new Set<string>();
  let match;
  while ((match = attrPattern.exec(html)) !== null) attrs.add(match[0]);
  return attrs.size > 0
    ? Array.from(attrs).slice(0, 20).join('\n  ')
    : '(none)';
}

function extractSurroundingContext(fullHtml: string, targetId: string): string {
  if (!fullHtml || !targetId) return '';
  const sectionMatch = fullHtml.match(
    new RegExp(`<section[^>]*>[\\s\\S]*?id=["']${targetId}["'][\\s\\S]*?<\\/section>`, 'i')
  );
  if (sectionMatch) return sectionMatch[0];
  const idx = fullHtml.indexOf(targetId);
  if (idx !== -1) return fullHtml.slice(Math.max(0, idx - 400), Math.min(fullHtml.length, idx + 600));
  return '';
}

function smartReplaceElement(
  fullHtml: string,
  targetElement?: { id?: string; tagName?: string; text?: string; htmlSnippet?: string; href?: string },
  newElementHtml?: string
): string {
  if (!newElementHtml || !fullHtml) return fullHtml;
  const targetId = targetElement?.id;
  const tag = (targetElement?.tagName || '[a-z0-9]+').toLowerCase();
  const text = targetElement?.text?.trim();
  const href = targetElement?.href?.trim();
  const htmlSnippet = targetElement?.htmlSnippet?.trim();

  if (targetId && fullHtml.includes(targetId)) {
    const pairedRegex = new RegExp(`<${tag}\\b[^>]*id=["']${targetId}["'][\\s\\S]*?<\\/${tag}>`, 'i');
    if (pairedRegex.test(fullHtml)) return fullHtml.replace(pairedRegex, newElementHtml);
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*id=["']${targetId}["'][^>]*\\/?>`, 'i');
    if (selfClosingRegex.test(fullHtml)) return fullHtml.replace(selfClosingRegex, newElementHtml);
  }
  if (href && href.length > 3) {
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hrefRegex = new RegExp(`<${tag}\\b[^>]*href=["']${escapedHref}["'][\\s\\S]*?<\\/${tag}>`, 'i');
    if (hrefRegex.test(fullHtml)) return fullHtml.replace(hrefRegex, newElementHtml);
  }
  if (text && text.length > 1) {
    const words = text.split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (words.length > 0) {
      const loosePattern = words.join('[\\s\\S]*?');
      const textRegex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?${loosePattern}[\\s\\S]*?<\\/${tag}>`, 'i');
      if (textRegex.test(fullHtml)) return fullHtml.replace(textRegex, newElementHtml);
    }
  }
  if (htmlSnippet && fullHtml.includes(htmlSnippet)) return fullHtml.replace(htmlSnippet, newElementHtml);
  return fullHtml;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = (body.message || body.prompt || '').trim();
    const currentHtml = body.currentHtml || '';
    const currentTheme: ThemeName = body.currentTheme || body.theme || 'bram-light';
    const targetElement = body.targetElement;
    const blueprint = body.blueprint;

    if (!message) return NextResponse.json({ error: 'Message or prompt is required' }, { status: 400 });
    if (message.length > 4000) return NextResponse.json({ error: 'Prompt too long (max 4,000 chars).' }, { status: 400 });

    const isTargeted = Boolean(targetElement && targetElement.id);
    const intent = classifyIntent(message, isTargeted);
    const newTheme = detectTheme(message, currentTheme);
    const userPlan: 'free' | 'pro' = body.plan === 'pro' ? 'pro' : 'free';

    // ── GEMINI PATH ───────────────────────────────────────────────────────────
    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const profile = blueprint?.profile || {};
    const currency = profile.currency || 'USD';
    const mediaVault = blueprint?.mediaVault || [];
    const services = blueprint?.modules?.services?.items || [];
    const products = blueprint?.modules?.products?.items || [];
    const whatsappPhone = blueprint?.modules?.whatsapp?.phoneNumber || '';
    const isCartActive = blueprint?.modules?.cart?.enabled !== false;

    // ── MCP TOOL-CALLING PATH (DEFAULT FOR UNTARGETED MOBILE & DESKTOP EDITS) ──
    if (intent === 'mcp-tools') {
      let accountUserId: string | undefined;
      let dbSite: any = null;
      try {
        const session = await auth();
        accountUserId = session?.user?.id;
        if (!accountUserId && session?.user?.email) {
          const u = await prisma.user.findUnique({ where: { email: session.user.email } });
          accountUserId = u?.id;
        }
        if (accountUserId) {
          const reqSiteId = typeof body.siteId === 'string' && body.siteId !== 'proj_default' ? body.siteId : undefined;
          if (reqSiteId) {
            const found = await prisma.site.findUnique({ where: { id: reqSiteId } });
            if (found && found.userId === accountUserId) dbSite = found;
          }
          if (!dbSite) {
            dbSite = await prisma.site.findFirst({
              where: { userId: accountUserId },
              orderBy: { updatedAt: 'desc' },
            });
          }
        }
      } catch (authErr) {
        console.warn('[AI Chat MCP] Account lookup warning:', authErr);
      }

      let workingBlueprint: BusinessBlueprint;
      if (blueprint && blueprint.profile) {
        workingBlueprint = JSON.parse(JSON.stringify(blueprint));
      } else if (dbSite?.blueprintData) {
        try {
          workingBlueprint = JSON.parse(dbSite.blueprintData);
        } catch {
          workingBlueprint = createDefaultBlueprint({
            name: dbSite.name || 'My Studio',
            nicheId: dbSite.nicheId,
            templateId: dbSite.templateId,
          });
        }
      } else {
        workingBlueprint = createDefaultBlueprint({
          name: dbSite?.name || profile?.name || 'My Studio',
          nicheId: dbSite?.nicheId,
          templateId: dbSite?.templateId,
        });
      }

      const resolvedPlan: 'free' | 'pro' = dbSite?.plan === 'pro' || userPlan === 'pro' ? 'pro' : 'free';
      const activeTemplateId = resolveTemplateEngineId(workingBlueprint.templateId || dbSite?.templateId);
      const activeTemplateMeta = TEMPLATE_ENGINES[activeTemplateId];

      const templateOptions = Object.values(TEMPLATE_ENGINES)
        .map((t) => `"${t.id}" (${t.name}: ${t.tagline})`)
        .join(', ');

      const mediaSummary = (workingBlueprint.mediaVault || [])
        .slice(0, 12)
        .map((m, idx) => `${idx + 1}. id="${m.id}" name="${m.name}" type="${m.type}"`);

      const serviceSummary = (workingBlueprint.modules?.services?.items || [])
        .slice(0, 15)
        .map((s) => `- id="${s.id}" name="${s.name}" price=${s.price} priceMode="${s.priceMode}" enabled=${s.enabled}`);

      const productSummary = (workingBlueprint.modules?.products?.items || [])
        .slice(0, 10)
        .map((p) => `- id="${p.id}" name="${p.name}" price=${p.price} inStock=${p.inStock}`);

      const mcpSystemInstruction = `You are Cuzmify AI Copilot, wired directly to the website's Cuzmify MCP tools and template engine.
Your job is to inspect the active template + blueprint, execute the vendor's changes autonomously via MCP tools, and confirm the result clearly. Every mutation is automatically saved to the signed-in vendor's cloud account.

ACTIVE TEMPLATE AWARENESS:
- You know the vendor's active template engine ("${activeTemplateMeta.name}", id="${activeTemplateId}"): ${activeTemplateMeta.tagline}.
- Sections inside this template engine: hero, services, portfolio, testimonials, faq, booking.
- Editable visual design, layout & responsive breakpoint tokens (customize_template_design):
  * Pass device: "all" (default) OR isolate overrides strictly to "mobile" (<768px), "tablet" (768px-1023px), or "desktop" (>=1024px)!
  * Colors/fonts/buttons/CSS: accentColor, backgroundColor, surfaceColor, textColor, buttonRadius ("pill"|"rounded"|"sharp"), submitButtonIcon ("auto"|"whatsapp"|"sparkles"|"calendar"|"none"), submitButtonColor (#hex), customCss (safe scoped CSS rules), fontMood ("editorial_serif"|"modern_sans"|"bold_display").
  * Structural layouts & responsive tokens: heroLayout ("split"|"centered"|"full_bleed"|"minimal_card"), servicesLayout ("editorial_list"|"card_grid"|"compact_menu"), heroTextAlign ("left"|"center"), hideHeroImage (boolean), fontScale ("compact"|"normal"|"large"), pagePaddingX ("compact"|"normal"|"spacious"), sectionSpacing ("compact"|"normal"|"airy"), heroImageAspect, heroImageMaxHeight (140..680), heroImageShape, heroImageFit ("cover"|"contain"), galleryColumns (1..4), servicesColumns (1..3).
- Section Ordering & Custom Blocks: reorder_sections(order) arranges sections (hero, services, portfolio, custom, testimonials, faq, booking); upsert_custom_section builds bespoke cards, checklists, hours, CTA banners, OR sanitized custom_html blocks inside the active template engine.
- Immutable Injection Slots & SEO: inject_slot injects sanitized HTML/SVG into any named template slot (top_bar, nav_actions, hero_above, hero_cta_after, hero_below, services_above, services_below, booking_above, submit_button_prefix, submit_button_suffix, booking_below, footer); configure_seo configures search title, description, keywords, canonical URL, OpenGraph & LocalBusiness/Service JSON-LD schema.
- Service Images: upsert_service_package supports imageUrl, mediaAssetId, or photoNumber (from mediaItems) so any service package can display a photo across all templates and layouts.
- Editable template copy slots (customize_template_copy): heroBadge, primaryCta, submitButtonText, servicesEyebrow, servicesHeading, serviceItemCta, portfolioEyebrow, portfolioHeading, enquiryEyebrow, enquiryHeading, enquirySubheading, testimonialsHeading, faqHeading (plus headline/bio/name via update_business_profile).

STRICT AUTONOMY & SAFETY RULES:
1. ACT DECISIVELY: Whenever the vendor asks to edit, customize, add, remove, recolor, rename, hide/show a section, promote a photo, or publish live, CALL the matching MCP tool(s) immediately instead of only suggesting text options. You may chain multiple tool calls cleanly.
2. NEVER switch templates with switch_template_style unless the vendor specifically asks to change template/layout style (Editorial Atelier, Noir Showcase, or Modern Studio). Keep their current template ("${activeTemplateId}") intact for all copy, color, service, and section edits!
3. NEVER invent fake prices, street addresses, or client testimonials. If adding a service without a stated price, pass priceMode: "quote" with price: 0.
4. Available templateId choices when switching templates: ${templateOptions}.
5. After tools execute, respond in 1-3 warm, specific sentences mentioning the exact template and changes applied.`;

      const siteInspection = inspectRenderedSite(workingBlueprint, dbSite ? {
        id: dbSite.id,
        name: dbSite.name,
        subdomain: dbSite.subdomain,
        status: dbSite.status,
        customDomain: dbSite.customDomain,
        liveUrl: dbSite.liveUrl,
        plan: resolvedPlan,
      } : undefined);

      const mcpUserPrompt = `ACTIVE WEBSITE CONTEXT (ZERO-BROWSER VISUAL & STRUCTURAL SNAPSHOT):
- Account Site Connected: ${dbSite ? `YES (siteId="${dbSite.id}", status="${dbSite.status}", liveUrl="${dbSite.liveUrl || ''}")` : 'Guest session (browser storage only unless signed in)'}
- Active Template: "${activeTemplateMeta.name}" (id="${activeTemplateId}", default swatches=${activeTemplateMeta.swatches.join('/')})
- Effective Palette & Contrast: ${JSON.stringify(siteInspection.effectivePalette)} | WCAG=${JSON.stringify(siteInspection.contrastAudit)}
- Effective Viewport Design:
  * Mobile (<768px): ${JSON.stringify(siteInspection.effectiveDesign.mobile)}
  * Tablet (768-1023px): ${JSON.stringify(siteInspection.effectiveDesign.tablet)}
  * Desktop (>=1024px): ${JSON.stringify(siteInspection.effectiveDesign.desktop)}
- Rendered DOM Order: ${siteInspection.renderedSections.map((s) => `${s.id}[${s.type}]`).join(' -> ')}
- Skipped Sections: ${JSON.stringify(siteInspection.skippedSections)}
- Auto Visual & Launch QA Findings: ${JSON.stringify(siteInspection.qaFindings)}
- SEO Audit: ${JSON.stringify(siteInspection.seoAudit)}
- Active Injection Slots: ${JSON.stringify(siteInspection.activeInjections)} (available: ${siteInspection.availableSlots.join(', ')})
- Active Niche: "${workingBlueprint.nicheId}"
- Profile Name: "${workingBlueprint.profile.name}"
- Headline: "${workingBlueprint.customCopy?.headline || workingBlueprint.profile.tagline || ''}"
- Bio: "${workingBlueprint.customCopy?.subheadline || workingBlueprint.profile.bio || ''}"
- Location & Currency: city="${workingBlueprint.profile.city || ''}", country="${workingBlueprint.profile.country || ''}", currency="${workingBlueprint.profile.currency}"
- WhatsApp: "${workingBlueprint.modules?.whatsapp?.phoneNumber || '(not configured)'}"
- Services (${workingBlueprint.modules?.services?.items?.length || 0} items, plan="${resolvedPlan}"):
${serviceSummary.join('\n') || '  (none yet)'}
- Products (${workingBlueprint.modules?.products?.items?.length || 0} items):
${productSummary.join('\n') || '  (none yet)'}
- Custom Sections: ${workingBlueprint.customSections?.length || 0}, Testimonials: ${workingBlueprint.testimonials?.length || 0}, FAQs: ${workingBlueprint.faqs?.length || 0}
- Media Inventory (${workingBlueprint.mediaVault?.length || 0} photos):
${JSON.stringify(siteInspection.mediaInventory)}

VENDOR REQUEST: "${message}"`;

      const candidateModels = ['gemini-3.5-flash', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite'];
      let mcpLastError: any = null;

      for (const modelName of candidateModels) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const mcpModel = genAI.getGenerativeModel({
              model: modelName,
              tools: [{ functionDeclarations: toGeminiFunctionDeclarations(true) }],
              toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
              generationConfig: {
                temperature: 0.25,
                maxOutputTokens: 2048,
              },
              systemInstruction: mcpSystemInstruction,
            });

            const chat = mcpModel.startChat({});
            let bpCursor = workingBlueprint;
            const toolCalls: Array<{
              name: string;
              args: Record<string, any>;
              ok: boolean;
              summary: string;
              error?: string;
            }> = [];
            const changesApplied: string[] = [];
            let templateSwitched = false;
            let mutatedBlueprint = false;
            let shouldPublish = false;
            let nextInput: string | Part[] = mcpUserPrompt;
            let finalTextReply = '';

            for (let round = 0; round < 4; round++) {
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout: ${modelName} took over 45s`)), 45000)
              );

              const result: any = await Promise.race([
                chat.sendMessage(nextInput),
                timeoutPromise,
              ]);

              const fnCalls =
                typeof result?.response?.functionCalls === 'function'
                  ? result.response.functionCalls() || []
                  : [];

              if (fnCalls.length === 0) {
                try {
                  finalTextReply = result?.response?.text?.()?.trim() || '';
                } catch {
                  finalTextReply = '';
                }
                break;
              }

              const responseParts: Part[] = [];

              for (const fnCall of fnCalls) {
                if (!fnCall?.name) continue;
                const args = (fnCall.args || {}) as Record<string, any>;

                if (fnCall.name === 'list_enquiries') {
                  if (!dbSite) {
                    const msg = 'No cloud website linked yet. Sign in to view client booking enquiries.';
                    toolCalls.push({ name: 'list_enquiries', args, ok: false, summary: msg, error: msg });
                    responseParts.push({
                      functionResponse: { name: 'list_enquiries', response: { ok: false, error: msg } },
                    });
                    continue;
                  }
                  const limit = Math.min(25, Math.max(1, Number(args.limit) || 10));
                  const leads = await prisma.enquiry.findMany({
                    where: { siteId: dbSite.id },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    select: {
                      id: true,
                      clientName: true,
                      clientPhone: true,
                      serviceName: true,
                      status: true,
                      createdAt: true,
                    },
                  });
                  const summary = `Fetched ${leads.length} booking enquiries`;
                  toolCalls.push({ name: 'list_enquiries', args, ok: true, summary });
                  changesApplied.push(summary);
                  responseParts.push({
                    functionResponse: {
                      name: 'list_enquiries',
                      response: { ok: true, count: leads.length, enquiries: leads },
                    },
                  });
                  continue;
                }

                if (fnCall.name === 'publish_site') {
                  if (!dbSite) {
                    const msg = 'Sign in and save your website once to publish to a live link.';
                    toolCalls.push({ name: 'publish_site', args, ok: false, summary: msg, error: msg });
                    responseParts.push({
                      functionResponse: { name: 'publish_site', response: { ok: false, error: msg } },
                    });
                    continue;
                  }
                  shouldPublish = true;
                  mutatedBlueprint = true;
                  const cleanSlug =
                    dbSite.subdomain ||
                    (bpCursor.profile.name || dbSite.name || 'studio')
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, '')
                      .slice(0, 30) ||
                    'studio';
                  const summary = `Published site live at /s/${cleanSlug}`;
                  toolCalls.push({ name: 'publish_site', args, ok: true, summary });
                  changesApplied.push(summary);
                  responseParts.push({
                    functionResponse: {
                      name: 'publish_site',
                      response: { ok: true, liveUrl: `/s/${cleanSlug}`, template: TEMPLATE_ENGINES[resolveTemplateEngineId(bpCursor.templateId)].name },
                    },
                  });
                  continue;
                }

                const exec = executeBlueprintMcpTool(fnCall.name, args, bpCursor, {
                  plan: resolvedPlan,
                  siteMeta: dbSite
                    ? { id: dbSite.id, subdomain: dbSite.subdomain, status: dbSite.status, customDomain: dbSite.customDomain }
                    : undefined,
                });
                bpCursor = exec.blueprint;
                const isReadOnlyTool = fnCall.name === 'get_site_blueprint' || fnCall.name === 'inspect_rendered_page';
                if (exec.ok && !isReadOnlyTool) {
                  mutatedBlueprint = true;
                }
                if (fnCall.name === 'switch_template_style' && exec.ok) {
                  templateSwitched = true;
                }
                toolCalls.push({
                  name: fnCall.name,
                  args,
                  ok: exec.ok,
                  summary: exec.changeSummary,
                  ...(exec.error ? { error: exec.error } : {}),
                });
                if (exec.ok && !isReadOnlyTool && exec.changeSummary) {
                  changesApplied.push(exec.changeSummary);
                } else if (!exec.ok && exec.error) {
                  changesApplied.push(exec.error);
                }

                responseParts.push({
                  functionResponse: {
                    name: fnCall.name,
                    response: {
                      ok: exec.ok,
                      summary: exec.changeSummary,
                      ...(exec.data ? { data: exec.data } : {}),
                      ...(exec.error ? { error: exec.error } : {}),
                    },
                  },
                });
              }

              nextInput = responseParts;
            }

            let savedToAccount = false;
            let liveUrl: string | null = dbSite?.liveUrl || null;
            if ((mutatedBlueprint || shouldPublish) && dbSite && accountUserId && dbSite.userId === accountUserId) {
              const rendered = renderTemplateEngine(bpCursor.templateId, bpCursor, { siteId: dbSite.id });
              const cleanSub =
                dbSite.subdomain ||
                (bpCursor.profile.name || dbSite.name || 'studio')
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, '')
                  .slice(0, 30) ||
                'studio';
              liveUrl = dbSite.liveUrl || `/s/${cleanSub}`;
              await prisma.site.update({
                where: { id: dbSite.id },
                data: {
                  name: bpCursor.profile.name || dbSite.name,
                  nicheId: bpCursor.nicheId || dbSite.nicheId,
                  templateId: rendered.templateId,
                  template: TEMPLATE_ENGINES[rendered.templateId].name,
                  category: bpCursor.profile.category || dbSite.category,
                  currency: bpCursor.profile.currency || dbSite.currency,
                  whatsappPhone: bpCursor.modules?.whatsapp?.phoneNumber || dbSite.whatsappPhone,
                  instagramHandle: bpCursor.profile.instagramHandle || dbSite.instagramHandle,
                  blueprintData: JSON.stringify(bpCursor),
                  htmlContent: rendered.fullHtml,
                  ...(shouldPublish ? { status: 'live', subdomain: cleanSub, liveUrl } : {}),
                  updatedAt: new Date(),
                },
              });
              savedToAccount = true;
            }

            const finalTplName = TEMPLATE_ENGINES[resolveTemplateEngineId(bpCursor.templateId)].name;
            if (!finalTextReply) {
              finalTextReply =
                changesApplied.length > 0
                  ? `Updated your ${finalTplName} site (${changesApplied.join('; ')})${savedToAccount ? ' and saved to your account.' : '.'}`
                  : `Your ${finalTplName} site is ready. Ask me to change copy, colors, sections, services, photos, or publish live.`;
            }

            return NextResponse.json({
              success: true,
              source: 'gemini-mcp',
              model: modelName,
              intent: 'mcp-tools',
              aiReply: finalTextReply,
              theme: currentTheme,
              activeTemplateId: resolveTemplateEngineId(bpCursor.templateId),
              activeTemplateName: finalTplName,
              changesApplied,
              toolCalls,
              templateSwitched,
              published: shouldPublish,
              savedToAccount,
              savedSiteId: dbSite?.id || null,
              liveUrl,
              updatedBlueprint: mutatedBlueprint ? bpCursor : null,
              updatedHtml: null,
              updatedElementHtml: null,
              blueprintUpdates: null,
            });
          } catch (candidateErr: any) {
            mcpLastError = candidateErr;
            const isTransient =
              candidateErr?.message?.includes('503') ||
              candidateErr?.message?.includes('429') ||
              candidateErr?.message?.includes('high demand') ||
              candidateErr?.message?.includes('fetch failed');

            if (isTransient && attempt === 0) {
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
            console.warn(`[AI Chat MCP] Model ${modelName} (attempt ${attempt + 1}) failed:`, candidateErr?.message);
            break;
          }
        }
      }

      return NextResponse.json(
        { error: `Gemini MCP Copilot failed: ${mcpLastError?.message || 'Google AI is temporarily busy.'}` },
        { status: 503 }
      );
    }

    const sectionManifest = extractSectionManifest(currentHtml);
    const cuzmifyAttributes = extractCuzmifyAttributes(currentHtml);
    const surroundingContext = isTargeted ? extractSurroundingContext(currentHtml, targetElement.id) : '';

    const mediaContextSnippet = mediaVault.length > 0
      ? `MEDIA VAULT (use these authentic images for backgrounds/galleries):\n${JSON.stringify(mediaVault.slice(0, 10).map((m: any) => ({ name: m.name, url: m.url, type: m.type })), null, 2)}`
      : 'No media vault images uploaded yet — use tasteful curated Unsplash imagery.';

    const blueprintCtx = `
BUSINESS BLUEPRINT (live composable modules — these are ACTIVE and must be preserved):
- Name: "${profile.name || 'Studio'}", Tagline: "${profile.tagline || ''}", Currency: "${currency}"
- WhatsApp: "${whatsappPhone}" → use data-cuzmify-action="whatsapp:booking"
- Services (${services.length} live): ${JSON.stringify(services.slice(0, 8).map((s: any) => ({ name: s.name, price: `${currency} ${s.price}`, desc: s.description?.slice(0, 60) })))}
- Products (${products.length} live): ${JSON.stringify(products.slice(0, 6).map((p: any) => ({ name: p.name, price: `${currency} ${p.price}` })))}
- Cart: ${isCartActive ? 'ACTIVE → data-cuzmify-action="cart:add" and data-cuzmify-action="cart:open"' : 'INACTIVE'}`;

    let systemInstruction = '';
    let userPrompt = '';

    // ─────────────────────────────────────────────────────────────────────────
    if (intent === 'full-transform') {
      systemInstruction = `You are Cuzmify AI, a world-class creative director and front-end architect.
Your job: Beautifully restyle and enrich the existing website to match the user's requested aesthetic — while keeping the underlying section structure and blueprint data hooks completely intact.

═══════════════════════════════════════════════════
STRUCTURAL INTEGRITY RULES (NON-NEGOTIABLE):
═══════════════════════════════════════════════════
1. SECTION ORDER IS LOCKED. Keep all existing <section> elements in exactly the same order. Do not add, remove, or reorder sections.
2. SECTION IDs ARE SACRED. Every section that had an id attribute must keep the exact same id in your output.
3. DATA ATTRIBUTES ARE SACRED. Every data-cuzmify-* attribute (data-cuzmify-action, data-cuzmify-type, etc.) must be copied exactly into your output — these power live WhatsApp, cart, booking, and payment integrations.
4. COMPOSABLE MODULE SLOTS: Existing product grids (data-cuzmify-type="products"), service selectors (data-cuzmify-type="service-select"), cart pills (data-cuzmify-type="cart-pill"), and booking forms must remain in place and keep their attributes.
5. ROOT-LEVEL SIBLINGS ONLY: Return direct sibling <nav> and <section> elements. NEVER wrap the whole page in a single <main>, <header>, or <div> container. Every section must be an independent top-level sibling so the visual editor can reorder them.

═══════════════════════════════════════════════════
CREATIVE FREEDOMS (go all out here):
═══════════════════════════════════════════════════
✦ Completely restyle backgrounds, gradients, overlays, and images
✦ Redesign typography: headline sizes, weights, letter-spacing, clamp() fluid scaling
✦ Redesign color palette to match the requested aesthetic
✦ Restyle buttons, cards, grids, borders, shadows, and spacing
✦ Rewrite all copy, headlines, subheadlines, descriptions, and CTAs to match the niche and tone
✦ Add tasteful decorative elements: SVG accents, blur circles, patterns, grid overlays
✦ Improve section layout: go multi-column, asymmetric, full-bleed — as long as sections stay in order
✦ Update services and pricing display to use the real blueprint services listed below
✦ Use Media Vault images where relevant

═══════════════════════════════════════════════════
MOBILE-FIRST RESPONSIVE RULES:
═══════════════════════════════════════════════════
- Headlines: font-size: clamp(2rem, 5vw, 3.5rem)
- Body: font-size: clamp(0.9rem, 2vw, 1.1rem)
- Grids: display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;
- All containers: box-sizing: border-box; max-width: 1200px; margin: 0 auto; padding: 0 24px;
- Buttons: min-height: 44px; padding: 12px 28px; width: auto (never full-width unless intended)

${blueprintCtx}

${mediaContextSnippet}

Return strictly a JSON object:
{
  "aiReply": "2-3 sentences describing the transformation applied",
  "theme": "dark-obsidian" | "luxury" | "minimal" | "editorial" | "bram-light" | "apple-luxury" | "vibrant" | "modern" | "dark-elegance" | "google-material",
  "changesApplied": ["List of specific changes made — be precise"],
  "blueprintUpdates": { "profile": null, "services": [] },
  "updatedHtml": "The complete transformed HTML"
}`;

      userPrompt = `User Request: "${message}"
Current Theme: "${currentTheme}"
Requested Theme: "${newTheme}"

EXISTING SECTION STRUCTURE (keep in exactly this order — IDs are locked):
${sectionManifest}

ACTIVE data-cuzmify-* ATTRIBUTES (must ALL appear in your output HTML):
  ${cuzmifyAttributes}

EXISTING FULL HTML (transform the visuals, preserve the structure):
\`\`\`html
${currentHtml.slice(0, 10000)}
\`\`\`

Transform this into a stunning ${newTheme} aesthetic. Keep all sections in order, all IDs, and all data-cuzmify-* attributes.
Return JSON with "aiReply", "theme", "changesApplied", "blueprintUpdates", "updatedHtml".`;

    // ─────────────────────────────────────────────────────────────────────────
    } else if (intent === 'element-style') {
      systemInstruction = `You are Cuzmify AI, the Granular Element Editor.
RULES:
1. Return ONLY the updated element HTML with the same id attribute.
2. NEVER return full page HTML.
3. Buttons: inline pill sizing (width: auto; padding: 12px 28px; border-radius: 9999px).
4. Preserve all data-cuzmify-* attributes exactly.
5. Never erase text content from buttons or headings.

Return JSON: { "aiReply": "...", "changesApplied": ["..."], "updatedElementHtml": "..." }`;

      userPrompt = `User Instruction: "${message}"
Target: <${targetElement.tagName} id="${targetElement.id}">
Text: "${targetElement.text || ''}"
Snippet:
\`\`\`html
${targetElement.htmlSnippet || `<${targetElement.tagName} id="${targetElement.id}">${targetElement.text || ''}</${targetElement.tagName}>`}
\`\`\`
Context:
\`\`\`html
${surroundingContext}
\`\`\`
Return JSON with "aiReply", "changesApplied", "updatedElementHtml".`;

    // ─────────────────────────────────────────────────────────────────────────
    } else if (intent === 'add-section') {
      systemInstruction = `You are Cuzmify AI, expert at composing modular sections for a live website builder.

CRITICAL RULES:
1. Return ONLY the new <section> HTML to APPEND — the existing page is READ-ONLY.
2. Use real blueprint services, products, and WhatsApp from the modules below.
3. Mobile-first: clamp() typography, auto-fit grids, box-sizing: border-box.
4. Include data-cuzmify-* attributes for all interactive elements.

${blueprintCtx}
${mediaContextSnippet}

Return JSON: { "aiReply": "...", "changesApplied": ["..."], "newSectionHtml": "<section>...</section>", "blueprintUpdates": null }`;

      userPrompt = `User Request: "${message}"
Current Theme: "${currentTheme}"
EXISTING PAGE (READ-ONLY — do not reproduce or modify):
\`\`\`html
${currentHtml.slice(0, 6000)}
\`\`\`
Return ONLY the new section HTML to append.
Return JSON with "aiReply", "changesApplied", "newSectionHtml", "blueprintUpdates".`;

    // ─────────────────────────────────────────────────────────────────────────
    } else {
      // full-rebuild — user explicitly asked
      systemInstruction = `You are Cuzmify AI, the Autonomous Website Architect.
User explicitly requested a complete rebuild. Generate a stunning, fully responsive site.
${blueprintCtx}
${mediaContextSnippet}
Mobile-first: clamp() typography, auto-fit grids, 44px touch targets, box-sizing: border-box.
Preserve all data-cuzmify-* attributes.
Return JSON: { "aiReply": "...", "theme": "...", "changesApplied": ["..."], "blueprintUpdates": {}, "updatedHtml": "..." }`;

      userPrompt = `User Request: "${message}"
Current Theme: "${currentTheme}"
Existing HTML (for reference):
\`\`\`html
${currentHtml}
\`\`\`
Return JSON with "aiReply", "theme", "changesApplied", "blueprintUpdates", "updatedHtml".`;
    }

    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];

    let lastError: any = null;
    for (const modelName of candidateModels) {
      // Retry up to 2 times on transient Google 503/429 load spikes
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
              maxOutputTokens: 16384,
            },
            systemInstruction,
          });

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${modelName} took over 60s`)), 60000)
          );

          const result: any = await Promise.race([model.generateContent(userPrompt), timeoutPromise]);
          const responseText = result.response.text();
          const parsedData = safeParseAIResponse(responseText);

          let finalHtml: string | null = null;
          if (intent === 'element-style' && parsedData?.updatedElementHtml) {
            finalHtml = smartReplaceElement(currentHtml, targetElement, parsedData.updatedElementHtml);
          } else if (intent === 'add-section' && parsedData?.newSectionHtml) {
            const newSection = parsedData.newSectionHtml;
            finalHtml = currentHtml.includes('</body>')
              ? currentHtml.replace(/<\/body>/i, `\n${newSection}\n</body>`)
              : currentHtml + '\n' + newSection;
          } else if ((intent === 'full-transform' || intent === 'full-rebuild') && parsedData?.updatedHtml) {
            finalHtml = parsedData.updatedHtml;
          }

          const rawChanges = parsedData.changesApplied;
          const changesApplied: string[] = Array.isArray(rawChanges)
            ? rawChanges.map((c: any) => String(c))
            : ['Applied requested changes'];

          return NextResponse.json({
            success: true,
            source: 'gemini',
            model: modelName,
            intent,
            aiReply: parsedData.aiReply || 'Transformation complete.',
            theme: parsedData.theme || newTheme || currentTheme,
            changesApplied,
            updatedHtml: finalHtml,
            updatedElementHtml: parsedData?.updatedElementHtml || null,
            blueprintUpdates: parsedData?.blueprintUpdates || null,
          });
        } catch (candidateErr: any) {
          lastError = candidateErr;
          const isTransient =
            candidateErr?.message?.includes('503') ||
            candidateErr?.message?.includes('429') ||
            candidateErr?.message?.includes('high demand') ||
            candidateErr?.message?.includes('fetch failed');

          if (isTransient && attempt === 0) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          console.warn(`[AI Chat] Model ${modelName} (attempt ${attempt + 1}) failed:`, candidateErr?.message);
          break; // Move to next candidate model
        }
      }
    }

    return NextResponse.json(
      { error: `Gemini API failed: ${lastError?.message || 'Google AI is currently busy. Please try again in a few moments.'}` },
      { status: 503 }
    );
  } catch (err: any) {
    console.error('[AI Chat API Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process AI chat request' }, { status: 500 });
  }
}


