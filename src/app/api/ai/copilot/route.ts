import { NextResponse } from 'next/server';
import { getGeminiClient, GEMINI_MODEL } from '@/lib/gemini';
import { AIEngine, type InlineRewriteResult } from '@/studio/ai/AIEngine';

export async function POST(req: Request) {
  try {
    const { text, action, customInstruction } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // 1. If Gemini API key is configured, call live LLM
    const genAI = getGeminiClient();
    if (genAI) {
      const candidateModels = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.5-flash-lite-preview-06-17'];
      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.7,
            },
            systemInstruction: `You are an elite UX/UI copywriter for luxury digital businesses. Keep your answers concise and directly usable on a website without quotation marks or conversational preamble.`,
          });

          let userPrompt = '';
          if (action === 'polish') {
            userPrompt = `Rewrite and polish the following text to sound world-class, elegant, and grammatically flawless:\n\n"${text}"`;
          } else if (action === 'punchy') {
            userPrompt = `Make the following text punchy, concise, and high-impact in 6 words or less:\n\n"${text}"`;
          } else if (action === 'tone_luxury') {
            userPrompt = `Rewrite the following text with an ultra-luxury, bespoke, haute-couture tone:\n\n"${text}"`;
          } else if (action === 'whatsapp_hook') {
            userPrompt = `Add a 24/7 instant WhatsApp reservation and consultation conversion hook to this text:\n\n"${text}"`;
          } else if (action === 'variations') {
            userPrompt = `Generate 3 distinct, high-converting website copy variations for:\n\n"${text}"\n\nFormat your response as 3 bullet points separated by newlines.`;
          } else if (action === 'custom') {
            userPrompt = `Apply this instruction to the text: "${customInstruction}".\nText: "${text}"`;
          }

          const result = await model.generateContent(userPrompt);
          const responseText = result.response.text().trim();

          if (action === 'variations') {
            const lines = responseText
              .split('\n')
              .map((l: string) => l.replace(/^[-*â€¢\d.]+\s*/, '').trim())
              .filter(Boolean)
              .slice(0, 3);

            return NextResponse.json({
              success: true,
              source: 'gemini',
              model: modelName,
              result: {
                original: text,
                action: '3 Variations Generated (Gemini AI)',
                transformed: text,
                variations: lines,
              },
            });
          }

          return NextResponse.json({
            success: true,
            source: 'gemini',
            model: modelName,
            result: {
              original: text,
              action: `Rewritten with Gemini AI (${action})`,
              transformed: responseText,
            },
          });
        } catch (geminiErr) {
          console.warn(`[Gemini Copilot API] Model ${modelName} call failed, trying next candidate:`, geminiErr);
        }
      }
    }

    // 2. Fallback to local heuristic engine
    const fallback = AIEngine.rewriteInlineText(text, action, customInstruction);
    return NextResponse.json({
      success: true,
      source: 'heuristic_engine',
      result: fallback,
    });
  } catch (err: any) {
    console.error('[AI Copilot API Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to rewrite text' },
      { status: 500 }
    );
  }
}

