import { NextResponse } from 'next/server';
import { getGeminiClient, GEMINI_MODEL } from '@/lib/gemini';
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
  targetElement?: { id?: string; tagName?: string; text?: string; htmlSnippet?: string; href?: string; classes?: string },
  newElementHtml?: string
): string {
  if (!newElementHtml || !fullHtml) return fullHtml;
  const targetId = targetElement?.id;
  const tag = (targetElement?.tagName || '[a-z0-9]+').toLowerCase();
  const text = targetElement?.text?.trim();
  const href = targetElement?.href?.trim();
  const htmlSnippet = targetElement?.htmlSnippet?.trim();

  // Strategy 1: Match by ID
  if (targetId && fullHtml.includes(targetId)) {
    const pairedRegex = new RegExp(`<${tag}\\b[^>]*id=["']${targetId}["'][\\s\\S]*?<\\/${tag}>`, 'i');
    if (pairedRegex.test(fullHtml)) {
      return fullHtml.replace(pairedRegex, newElementHtml);
    }
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*id=["']${targetId}["'][^>]*\\/?>`, 'i');
    if (selfClosingRegex.test(fullHtml)) {
      return fullHtml.replace(selfClosingRegex, newElementHtml);
    }
  }

  // Strategy 2: Match by Href (crucial for WhatsApp, external links & CTAs)
  if (href && href.length > 3) {
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hrefRegex = new RegExp(`<${tag}\\b[^>]*href=["']${escapedHref}["'][\\s\\S]*?<\\/${tag}>`, 'i');
    if (hrefRegex.test(fullHtml)) {
      return fullHtml.replace(hrefRegex, newElementHtml);
    }
  }

  // Strategy 3: Match by Tag + Loose Words Text Content
  if (text && text.length > 1) {
    const words = text.split(/\s+/).filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (words.length > 0) {
      const loosePattern = words.join('[\\s\\S]*?');
      const textRegex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?${loosePattern}[\\s\\S]*?<\\/${tag}>`, 'i');
      if (textRegex.test(fullHtml)) {
        return fullHtml.replace(textRegex, newElementHtml);
      }
    }
  }

  // Strategy 4: Match by exact htmlSnippet
  if (htmlSnippet && fullHtml.includes(htmlSnippet)) {
    return fullHtml.replace(htmlSnippet, newElementHtml);
  }

  return fullHtml;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = (body.message || body.prompt || '').trim();
    const currentHtml = body.currentHtml || '';
    const currentTheme = body.currentTheme || body.theme || 'bram-light';
    const targetElement = body.targetElement; // { id, tagName, text, classes, htmlSnippet }

    if (!message) {
      return NextResponse.json({ error: 'Message or prompt is required' }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: 'Prompt exceeds maximum character limit (4,000 characters).' }, { status: 400 });
    }

    if (currentHtml.length > 500000) {
      return NextResponse.json({ error: 'HTML payload exceeds maximum size limit (500KB).' }, { status: 400 });
    }

    const genAI = getGeminiClient();
    if (!genAI) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    // High-speed sub-second flash candidate models
    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
    ];

    const isTargeted = Boolean(targetElement && targetElement.id);
    const surroundingContext = isTargeted ? extractSurroundingContext(currentHtml, targetElement.id) : '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
          systemInstruction: isTargeted
            ? `You are Cuzmify AI, the world-class Granular Element Editor.
CRITICAL DESIGN & SCOPE RULES:
1. BUTTONS & CTAs:
   - NEVER make buttons 100% full-width across the screen unless explicitly requested for mobile full-width! Always use inline pill sizing:
     'display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: auto; max-width: fit-content; margin: 8px auto; padding: 12px 28px; border-radius: 9999px; font-size: 14px; font-weight: 700; text-decoration: none;'
   - ALWAYS preserve the exact text label and icon inside the button. NEVER erase text or leave an empty button!
   - Ensure the button is fully visible with opacity: 1 and high-contrast colors matching the surrounding section theme.
2. SURGICAL REPLACEMENT:
   - Return ONLY the updated single element HTML snippet with the same id attribute intact.

Return strictly a JSON object with:
{
  "aiReply": "Clear 1-sentence explanation of what was modified on the element",
  "changesApplied": ["Bullet of change 1", "Bullet of change 2"],
  "updatedElementHtml": "The complete modified HTML element"
}`
            : `You are Cuzmify AI, the world-class Autonomous AI Website Architect.
Transform or generate the website layout according to the user's instruction.
Return clean, self-contained HTML that lives inside the canvas wrapper.
Return strictly a JSON object with:
{
  "aiReply": "Brief explanation of the layout changes",
  "theme": "luxury" | "modern" | "minimal" | "editorial" | "bram-light" | "dark-obsidian" | "apple-luxury" | "vibrant",
  "changesApplied": ["List of applied changes"],
  "updatedHtml": "The complete resulting HTML markup"
}`,
        });

        const userPrompt = isTargeted
          ? `User Instruction: "${message}"
Target Element ID: "${targetElement.id}"
Target Element Tag: <${targetElement.tagName}>
Target Element Original Text: "${targetElement.text || ''}"
Target Element Snippet:
\`\`\`html
${targetElement.htmlSnippet || `<${targetElement.tagName} id="${targetElement.id}">${targetElement.text || ''}</${targetElement.tagName}>`}
\`\`\`

Surrounding Section Context:
\`\`\`html
${surroundingContext}
\`\`\`

Return JSON with "aiReply", "changesApplied" (array of strings), and "updatedElementHtml".`
          : `User Instruction: "${message}"
Current Theme: "${currentTheme}"
Existing Full HTML Document:
\`\`\`html
${currentHtml}
\`\`\`

Return JSON with "aiReply", "theme", "changesApplied", and "updatedHtml".`;

        // Add 10-second timeout per candidate model for fast failover
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${modelName} took over 10s`)), 10000)
        );

        const generatePromise = model.generateContent(userPrompt);
        const result: any = await Promise.race([generatePromise, timeoutPromise]);

        const responseText = result.response.text();
        let cleanJson = responseText.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
        }

        const parsedData = JSON.parse(cleanJson);

        let finalHtml = currentHtml;
        if (isTargeted && parsedData?.updatedElementHtml) {
          finalHtml = smartReplaceElement(currentHtml, targetElement, parsedData.updatedElementHtml);
        } else if (parsedData?.updatedHtml) {
          finalHtml = parsedData.updatedHtml;
        }

        const rawChanges = parsedData.changesApplied;
        const changesApplied: string[] = Array.isArray(rawChanges)
          ? rawChanges.map((c: any) => String(c))
          : typeof rawChanges === 'string'
          ? [rawChanges]
          : ['Applied requested visual styling & layout adjustments'];

        return NextResponse.json({
          success: true,
          source: 'gemini',
          model: modelName,
          aiReply: parsedData.aiReply || 'Applied requested changes.',
          theme: parsedData.theme || currentTheme || 'bram-light',
          changesApplied,
          updatedHtml: finalHtml,
          updatedElementHtml: parsedData?.updatedElementHtml || null,
        });
      } catch (candidateErr: any) {
        lastError = candidateErr;
        console.warn(`[AI Chat API] Model ${modelName} call failed, trying next candidate:`, candidateErr?.message || candidateErr);
      }
    }

    // If all models failed
    return NextResponse.json(
      {
        error: `Gemini API call failed: ${lastError?.message || 'Google Gemini API is temporarily busy. Please try again in a few moments.'}`,
      },
      { status: 503 }
    );
  } catch (err: any) {
    console.error('[AI Chat API Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process AI chat request' },
      { status: 500 }
    );
  }
}
