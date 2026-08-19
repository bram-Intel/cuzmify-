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

function replaceElementInHtml(fullHtml: string, targetId: string, tagName?: string, newElementHtml?: string): string {
  if (!newElementHtml) return fullHtml;
  const tag = tagName || '[a-z0-9]+';
  const pairedRegex = new RegExp(`<${tag}\\b[^>]*id=["']${targetId}["'][\\s\\S]*?<\\/${tag}>`, 'i');
  if (pairedRegex.test(fullHtml)) {
    return fullHtml.replace(pairedRegex, newElementHtml);
  }
  const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*id=["']${targetId}["'][^>]*\\/?>`, 'i');
  if (selfClosingRegex.test(fullHtml)) {
    return fullHtml.replace(selfClosingRegex, newElementHtml);
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

    // High-speed, sub-second flash candidate models
    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash',
      'gemini-3-flash-preview',
    ];

    const isTargeted = Boolean(targetElement && targetElement.id);
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
          systemInstruction: isTargeted
            ? `You are Cuzmify AI, the world-class Granular Element Editor. The user selected a specific element on the webpage.
Modify ONLY that targeted element based on the user's prompt.
If the user reports that the element is hidden or only visible on hover, make it permanently visible with 100% opacity, contrasting colors, and clear text.
Return strictly a JSON object with:
{
  "aiReply": "Brief 1-sentence explanation of what was modified on the element",
  "changesApplied": ["List of changes made to the element"],
  "updatedElementHtml": "The full modified HTML snippet of ONLY this single element"
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
Target Element HTML Snippet:
\`\`\`html
${targetElement.htmlSnippet || `<${targetElement.tagName} id="${targetElement.id}">${targetElement.text || ''}</${targetElement.tagName}>`}
\`\`\`

Return JSON with "aiReply", "changesApplied" (array of strings), and "updatedElementHtml".`
          : `User Instruction: "${message}"
Current Theme: "${currentTheme}"
Existing Full HTML Document:
\`\`\`html
${currentHtml}
\`\`\`

Return JSON with "aiReply", "theme", "changesApplied", and "updatedHtml".`;

        // Add 10-second timeout per candidate model for instant failover
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
          finalHtml = replaceElementInHtml(currentHtml, targetElement.id, targetElement.tagName, parsedData.updatedElementHtml);
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
