import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini';
import type { ThemeName } from '@/core/project-schema';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  changesApplied?: string[];
  theme?: ThemeName;
  snapshotHtml?: string;
}

// ── Intent Classifier ─────────────────────────────────────────────────────────
type PromptIntent =
  | 'style-only'
  | 'text-edit'
  | 'element-style'
  | 'add-section'
  | 'full-rebuild';

function classifyIntent(prompt: string, hasTarget: boolean): PromptIntent {
  if (hasTarget) return 'element-style';

  const p = prompt.toLowerCase();

  // Explicit full-rebuild keywords only
  if (
    (p.includes('redesign') && p.includes('everything')) ||
    p.includes('start fresh') ||
    p.includes('rebuild the site') ||
    p.includes('redo the whole') ||
    p.includes('completely rebuild') ||
    p.includes('full redesign')
  ) {
    return 'full-rebuild';
  }

  // Style-only: NEVER touch HTML structure
  if (
    p.includes('dark') || p.includes('light mode') || p.includes('dark mode') ||
    p.includes('dark feel') || p.includes('dark theme') || p.includes('obsidian') ||
    p.includes('luxury feel') || p.includes('minimal feel') || p.includes('vibrant') ||
    p.includes('color scheme') || p.includes('color palette') || p.includes('change colors') ||
    p.includes('change the font') || p.includes('change font') ||
    p.includes('make it darker') || p.includes('make it lighter') ||
    p.includes('gold accent') || p.includes('change theme') ||
    p.includes('background color') || p.includes('text color') ||
    (p.includes('transform') && (p.includes('dark') || p.includes('light') || p.includes('feel') || p.includes('look')))
  ) {
    return 'style-only';
  }

  // Add-section: append only, never touch existing
  if (
    p.includes('add a') || p.includes('add an') || p.includes('add pricing') ||
    p.includes('add testimonial') || p.includes('add gallery') || p.includes('add faq') ||
    p.includes('add footer') || p.includes('add contact') || p.includes('add booking') ||
    p.includes('add whatsapp') || p.includes('add a section') || p.includes('insert a') ||
    p.includes('create a new') || p.includes('new section') || p.includes('include a')
  ) {
    return 'add-section';
  }

  // Text edit
  if (
    p.includes('change the heading') || p.includes('update the text') ||
    p.includes('rewrite') || p.includes('rename') || p.includes('edit the text') ||
    p.includes('change the title') || p.includes('update copy')
  ) {
    return 'text-edit';
  }

  return 'add-section';
}

function detectTheme(prompt: string, currentTheme: ThemeName): ThemeName {
  const p = prompt.toLowerCase();
  if (p.includes('dark') || p.includes('obsidian') || p.includes('night') || p.includes('black')) return 'dark-obsidian';
  if (p.includes('luxury') || p.includes('gold') || p.includes('royal') || p.includes('dubai')) return 'luxury';
  if (p.includes('minimal') || p.includes('clean') || p.includes('simple')) return 'minimal';
  if (p.includes('editorial') || p.includes('vogue') || p.includes('fashion')) return 'editorial';
  if (p.includes('vibrant') || p.includes('pink') || p.includes('playful') || p.includes('gen-z')) return 'vibrant';
  if (p.includes('apple') || p.includes('sleek') || p.includes('tech luxury')) return 'apple-luxury';
  if (p.includes('modern') || p.includes('indigo') || p.includes('contemporary')) return 'modern';
  if (p.includes('light') || p.includes('bram') || p.includes('bright')) return 'bram-light';
  return currentTheme;
}

function extractSurroundingContext(fullHtml: string, targetId: string): string {
  if (!fullHtml || !targetId) return '';
  const sectionMatch = fullHtml.match(
    new RegExp(`<section[^>]*>[\\s\\S]*?id=["']${targetId}["'][\\s\\S]*?<\\/section>`, 'i')
  );
  if (sectionMatch) return sectionMatch[0];
  const idx = fullHtml.indexOf(targetId);
  if (idx !== -1) {
    const start = Math.max(0, idx - 400);
    const end = Math.min(fullHtml.length, idx + 600);
    return fullHtml.slice(start, end);
  }
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

    if (!message) {
      return NextResponse.json({ error: 'Message or prompt is required' }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: 'Prompt exceeds maximum character limit (4,000 characters).' }, { status: 400 });
    }

    const isTargeted = Boolean(targetElement && targetElement.id);
    const intent = classifyIntent(message, isTargeted);

    // ── FAST PATH: Style-only ─────────────────────────────────────────────────
    if (intent === 'style-only') {
      const newTheme = detectTheme(message, currentTheme);
      const themeLabels: Record<ThemeName, string> = {
        'dark-obsidian': 'Dark Obsidian',
        'luxury': 'Gold Luxury',
        'minimal': 'Clean Minimal',
        'editorial': 'High-Fashion Editorial',
        'vibrant': 'Vibrant & Playful',
        'apple-luxury': 'Apple Precision',
        'google-material': 'Google Material',
        'dark-elegance': 'Dark Elegance',
        'modern': 'Modern Indigo',
        'bram-light': 'Bram Light',
      };
      return NextResponse.json({
        success: true,
        source: 'style-fast-path',
        intent: 'style-only',
        aiReply: `Applied the ${themeLabels[newTheme]} theme. Section layout, content order, and all existing text are completely preserved.`,
        theme: newTheme,
        changesApplied: [
          `Switched to "${themeLabels[newTheme]}" theme`,
          'All existing sections and their order preserved exactly',
          'Design tokens (colors, fonts, spacing) updated globally',
        ],
        updatedHtml: null,
        updatedElementHtml: null,
        blueprintUpdates: null,
      });
    }

    // ── GEMINI PATH ───────────────────────────────────────────────────────────
    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in the server environment.' },
        { status: 500 }
      );
    }

    const profile = blueprint?.profile || {};
    const currency = profile.currency || 'USD';
    const mediaVault = blueprint?.mediaVault || [];
    const services = blueprint?.modules?.services?.items || [];
    const products = blueprint?.modules?.products?.items || [];
    const whatsappPhone = blueprint?.modules?.whatsapp?.phoneNumber || '18005554526';
    const isCartActive = blueprint?.modules?.cart?.enabled !== false;

    const surroundingContext = isTargeted ? extractSurroundingContext(currentHtml, targetElement.id) : '';

    const mediaContextSnippet = mediaVault.length > 0
      ? `AUTHENTIC MEDIA VAULT ASSETS:\n${JSON.stringify(mediaVault.slice(0, 12).map((m: any) => ({ name: m.name, url: m.url, type: m.type })), null, 2)}`
      : 'No custom media uploaded yet.';

    const modulesContextSnippet = `
COMPOSABLE MODULES:
- Business Profile: Name: "${profile.name || 'Studio'}", Currency: "${currency}"
- WhatsApp: Phone "${whatsappPhone}" -> data-cuzmify-action="whatsapp:booking"
- Services (${services.length}): ${JSON.stringify(services.slice(0, 6).map((s: any) => ({ name: s.name, price: `${currency} ${s.price}` })))}
- Products (${products.length}): ${JSON.stringify(products.slice(0, 6).map((p: any) => ({ name: p.name, price: `${currency} ${p.price}` })))}
- Cart: ${isCartActive ? 'ACTIVE (data-cuzmify-action="cart:add")' : 'INACTIVE'}`;

    let systemInstruction = '';
    let userPrompt = '';

    if (intent === 'element-style' || intent === 'text-edit') {
      systemInstruction = `You are Cuzmify AI, the world-class Granular Element Editor.
RULES:
1. Return ONLY the updated single element HTML with the same id attribute.
2. NEVER return full page HTML or touch other elements.
3. Buttons: inline pill sizing (width: auto, padding: 12px 28px, border-radius: 9999px).
4. Always preserve the exact text label inside buttons.
5. Keep all data-cuzmify-* attributes exactly as they were.

Return JSON: { "aiReply": "...", "changesApplied": ["..."], "updatedElementHtml": "..." }`;

      userPrompt = `User Instruction: "${message}"
Target Element ID: "${targetElement.id}"
Target Element: <${targetElement.tagName}>
Text: "${targetElement.text || ''}"
Snippet: \`\`\`html\n${targetElement.htmlSnippet || `<${targetElement.tagName} id="${targetElement.id}">${targetElement.text || ''}</${targetElement.tagName}>`}\n\`\`\`
Context: \`\`\`html\n${surroundingContext}\n\`\`\`
Return JSON with "aiReply", "changesApplied", "updatedElementHtml".`;

    } else if (intent === 'add-section') {
      systemInstruction = `You are Cuzmify AI, expert at composing new modular sections for a live website builder.

CRITICAL STRUCTURE RULES:
1. NEVER modify, reorder, or delete the existing page sections. They are READ-ONLY.
2. Return ONLY the NEW section HTML to be APPENDED — not the full page.
3. The new section must be a self-contained <section> with clean responsive HTML.
4. Use the business's composable modules from the blueprint.
5. Use authentic Media Vault images when relevant.
6. Mobile-first: clamp() for font sizes, auto-fit grids, box-sizing: border-box.
7. Preserve all data-cuzmify-* attributes.

${modulesContextSnippet}
${mediaContextSnippet}

Return JSON: { "aiReply": "...", "changesApplied": ["..."], "newSectionHtml": "<section>...</section>", "blueprintUpdates": null }`;

      userPrompt = `User Instruction: "${message}"
Current Theme: "${currentTheme}"

EXISTING PAGE (READ-ONLY — DO NOT REPRODUCE OR MODIFY):
\`\`\`html
${currentHtml.slice(0, 8000)}
\`\`\`

Generate ONLY the new <section> to append. Do NOT include any existing sections.
Return JSON with "aiReply", "changesApplied", "newSectionHtml", "blueprintUpdates".`;

    } else {
      // full-rebuild — user explicitly requested
      systemInstruction = `You are Cuzmify AI, the Autonomous Website Architect.
The user has explicitly requested a complete site rebuild.
${modulesContextSnippet}
${mediaContextSnippet}
Mobile-first: clamp() typography, auto-fit grids, box-sizing: border-box, 44px touch targets.
Preserve all data-cuzmify-* attributes.
Return JSON: { "aiReply": "...", "theme": "...", "changesApplied": ["..."], "blueprintUpdates": {}, "updatedHtml": "..." }`;

      userPrompt = `User Instruction: "${message}"
Current Theme: "${currentTheme}"
Existing HTML:
\`\`\`html
${currentHtml}
\`\`\`
Return JSON with "aiReply", "theme", "changesApplied", "blueprintUpdates", "updatedHtml".`;
    }

    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
    ];

    let lastError: any = null;
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
          systemInstruction,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${modelName} over 10s`)), 10000)
        );

        const result: any = await Promise.race([model.generateContent(userPrompt), timeoutPromise]);
        const responseText = result.response.text();
        let cleanJson = responseText.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
        }
        const parsedData = JSON.parse(cleanJson);

        let finalHtml: string | null = null;
        if ((intent === 'element-style' || intent === 'text-edit') && parsedData?.updatedElementHtml) {
          finalHtml = smartReplaceElement(currentHtml, targetElement, parsedData.updatedElementHtml);
        } else if (intent === 'add-section' && parsedData?.newSectionHtml) {
          const newSection = parsedData.newSectionHtml;
          if (currentHtml.includes('</body>')) {
            finalHtml = currentHtml.replace(/<\/body>/i, `\n${newSection}\n</body>`);
          } else {
            finalHtml = currentHtml + '\n' + newSection;
          }
        } else if (intent === 'full-rebuild' && parsedData?.updatedHtml) {
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
          aiReply: parsedData.aiReply || 'Applied requested changes.',
          theme: parsedData.theme || currentTheme,
          changesApplied,
          updatedHtml: finalHtml,
          updatedElementHtml: parsedData?.updatedElementHtml || null,
          blueprintUpdates: parsedData?.blueprintUpdates || null,
        });
      } catch (candidateErr: any) {
        lastError = candidateErr;
        console.warn(`[AI Chat API] Model ${modelName} failed:`, candidateErr?.message);
      }
    }

    return NextResponse.json(
      { error: `Gemini API call failed: ${lastError?.message || 'Google Gemini API is temporarily busy. Please try again.'}` },
      { status: 503 }
    );
  } catch (err: any) {
    console.error('[AI Chat API Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to process AI chat request' }, { status: 500 });
  }
}
