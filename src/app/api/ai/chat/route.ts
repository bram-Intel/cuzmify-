import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import type { ThemeName } from '@/core/project-schema';

// ── Intent Classifier ─────────────────────────────────────────────────────────
type PromptIntent =
  | 'style-only'        // Pure theme token swap — never touches HTML
  | 'element-style'     // Targeted element edit (targetElement provided)
  | 'add-section'       // Append a new section, existing sections are read-only
  | 'full-transform'    // DEFAULT: Restyle the full site — structure is LOCKED
  | 'full-rebuild';     // Explicit wipe & rebuild (user said so explicitly)

function classifyIntent(prompt: string, hasTarget: boolean): PromptIntent {
  if (hasTarget) return 'element-style';
  const p = prompt.toLowerCase();

  // Pure unconstrained rebuild — only when user explicitly says so
  if (
    (p.includes('redesign') && p.includes('everything')) ||
    p.includes('start fresh') || p.includes('rebuild the site') ||
    p.includes('redo the whole') || p.includes('completely rebuild') ||
    p.includes('full redesign') || p.includes('start over')
  ) return 'full-rebuild';

  // Pure style/theme token swap — no HTML needed at all
  if (
    (p.includes('change theme') || p.includes('switch theme') || p.includes('apply theme')) &&
    !p.includes('transform') && !p.includes('design') && !p.includes('make')
  ) return 'style-only';

  // Append-only: add new sections, never touch existing
  if (
    p.includes('add a section') || p.includes('insert a section') ||
    p.includes('new section') || p.includes('include a section') ||
    (p.includes('add') && (
      p.includes('testimonial') || p.includes('faq') || p.includes('pricing table') ||
      p.includes('gallery section') || p.includes('contact section') ||
      p.includes('team section') || p.includes('map')
    ))
  ) return 'add-section';

  // Everything else = full-transform (structure-locked, visuals unlocked)
  return 'full-transform';
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

    // ── FAST PATH: Pure theme token swap ──────────────────────────────────────
    if (intent === 'style-only') {
      return NextResponse.json({
        success: true, source: 'style-fast-path', intent,
        aiReply: `Applied the ${newTheme} theme. All sections, layout, and blueprint connections preserved exactly.`,
        theme: newTheme,
        changesApplied: [`Switched to "${newTheme}" theme`, 'Section structure untouched', 'Design tokens updated globally'],
        updatedHtml: null, updatedElementHtml: null, blueprintUpdates: null,
      });
    }

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
    const whatsappPhone = blueprint?.modules?.whatsapp?.phoneNumber || '18005554526';
    const isCartActive = blueprint?.modules?.cart?.enabled !== false;

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
${currentHtml}
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

    const candidateModels = [
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash-lite-preview-06-17',
      'gemini-1.5-flash-latest',
    ];

    let lastError: any = null;
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.15 },
          systemInstruction,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${modelName} over 25s`)), 25000)
        );

        const result: any = await Promise.race([model.generateContent(userPrompt), timeoutPromise]);
        const responseText = result.response.text();
        let cleanJson = responseText.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
        }
        const parsedData = JSON.parse(cleanJson);

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
        console.warn(`[AI Chat] Model ${modelName} failed:`, candidateErr?.message);
      }
    }

    return NextResponse.json(
      { error: `Gemini API failed: ${lastError?.message || 'Temporarily busy. Please try again.'}` },
      { status: 503 }
    );
  } catch (err: any) {
    console.error('[AI Chat API Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process AI chat request' }, { status: 500 });
  }
}

