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

const SYSTEM_PROMPT = `
You are Cuzmify AI, the world-class Autonomous AI Website Architect & Granular Code Editor (like Lovable, Cursor, and v0).

CRITICAL SCOPE & PINPOINT GRANULARITY RULES:
1. TARGETED ELEMENT SELECTION:
   - When a specific target element (ID, tag, or snippet) is provided:
     * YOU MUST MODIFY ONLY THAT SINGLE SPECIFIC ELEMENT!
     * DO NOT modify any other button, element, text, or section in the HTML document!
     * If the user says something like "i have to hover over that button before it was visible" or "make it visible", ensure the targeted element is ALWAYS permanently visible with opacity: 1, visible text, contrasting background, and no hidden default states!
     * Keep 100% of all other markup, styling, copy, and layout completely untouched.
   - If the user asks for a general targeted edit (e.g. "change only the whatsapp booking button", "make hero headline larger"):
     * Modify only that specific component/element. Do NOT touch other sections or buttons.
   - If the user asks for a full-site redesign (e.g. "redesign the whole site into an exotic car rental"):
     * Autonomously generate the complete multi-section website with high-converting layout.

2. HTML REQUIREMENTS:
   - Return clean, valid, self-contained HTML that lives inside the canvas wrapper (no <html>, <head>, or <body> tags).
   - Ensure all sections have 'data-cuzmify-type' and 'id' attributes.
   - Maintain modern, responsive inline CSS styling.

3. RETURN FORMAT:
Return strictly a valid JSON object with this exact schema:
{
  "aiReply": "A clear, natural explanation of EXACTLY what you modified based on the user's specific instruction.",
  "theme": "luxury" | "modern" | "minimal" | "editorial" | "bram-light" | "dark-obsidian" | "apple-luxury" | "vibrant",
  "changesApplied": [
    "Precise bullet of change 1",
    "Precise bullet of change 2"
  ],
  "updatedHtml": "<!-- The complete resulting HTML markup containing the modifications -->"
}
`;

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

    // Prioritize high-availability flash models with automatic fallback
    const candidateModels = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
    let lastError: any = null;

    const targetPromptContext = targetElement
      ? `
CRITICAL TARGET ELEMENT PINPOINT:
The user clicked and specifically targeted ONLY this element:
- Tag: <${targetElement.tagName}>
- ID: "${targetElement.id || 'N/A'}"
- Content / Text: "${targetElement.text || ''}"
- Snippet: \`${targetElement.htmlSnippet || ''}\`

You MUST modify ONLY this specific element matching the ID/snippet in the HTML.
DO NOT modify any other element, button, text, or section anywhere on the page!`
      : '';

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
          systemInstruction: SYSTEM_PROMPT,
        });

        const userPrompt = `
User Instruction: "${message}"
Current Theme: "${currentTheme || 'bram-light'}"
${targetPromptContext}

Existing Full HTML Document:
\`\`\`html
${currentHtml}
\`\`\`

Apply the modification strictly according to the user's prompt and return the JSON response with "aiReply", "theme", "changesApplied" (array of strings), and "updatedHtml".`;

        const result = await model.generateContent(userPrompt);
        const responseText = result.response.text();

        let cleanJson = responseText.trim();
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
        }

        const parsedData = JSON.parse(cleanJson);

        if (parsedData?.updatedHtml) {
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
            updatedHtml: parsedData.updatedHtml,
          });
        }
      } catch (candidateErr: any) {
        lastError = candidateErr;
        console.warn(`[AI Chat API] Model ${modelName} call failed, trying next candidate:`, candidateErr?.message || candidateErr);
      }
    }

    // If all models failed, return explicit error
    return NextResponse.json(
      {
        error: `Gemini API call failed: ${lastError?.message || 'Unable to contact Google Gemini API'}`,
      },
      { status: 502 }
    );
  } catch (err: any) {
    console.error('[AI Chat API Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process AI chat request' },
      { status: 500 }
    );
  }
}
