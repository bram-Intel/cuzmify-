import { NextResponse } from 'next/server';
import { getGeminiClient, GEMINI_MODEL } from '@/lib/gemini';
import { AIEngine, type AITransformationPlan } from '@/studio/ai/AIEngine';

const SYSTEM_PROMPT = `
You are the Cuzmify AI Design Engine â€” a world-class website copywriter, brand director, and digital business architect for modern service businesses and luxury creators.

Given a user's prompt (which may describe an industry, aesthetic, bridal focus, medical spa, barbershop, high-fashion boutique, etc.), synthesize a complete, highly-converting, bespoke website transformation plan.

Return your response strictly as a JSON object matching this TypeScript structure:
{
  "theme": "luxury" | "modern" | "minimal" | "editorial" | "bram-light" | "dark-obsidian" | "apple-luxury" | "vibrant",
  "nicheDetected": string (e.g. "Bridal & Destination Weddings"),
  "toneDetected": string (e.g. "Opulent & Bespoke"),
  "summary": string (1-2 sentences explaining what was transformed),
  "heroHeadline": string (High-converting, captivating 6-10 word headline),
  "heroSubheadline": string (Engaging 1-2 sentence subheadline),
  "heroBadge": string (e.g. "âœ¦ Master Artistry Studio"),
  "heroCtaText": string (e.g. "âœ¦ Book VIP Session â†’"),
  "aboutTitle": string (Compelling about section headline),
  "aboutDescription": string (2-3 sentences of brand storytelling and expertise),
  "aboutBadge": string,
  "servicesTitle": string (Curated service catalog title),
  "services": [
    {
      "name": string,
      "price": string (e.g. "$350" or "$1,200"),
      "description": string,
      "tag": string (e.g. "SIGNATURE", "POPULAR", "VIP")
    }
  ],
  "galleryTitle": string,
  "galleryBadge": string,
  "bookingTitle": string,
  "bookingCta": string,
  "testimonialsTitle": string,
  "testimonials": [
    {
      "quote": string,
      "author": string
    }
  ],
  "ctaHeadline": string,
  "ctaSubheadline": string,
  "ctaButtonText": string
}
`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. If Gemini API key is configured, call live LLM
    const genAI = getGeminiClient();
    if (genAI) {
      const candidateModels = [
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-2.5-flash-lite-preview-06-17',
      ];
      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.7,
            },
            systemInstruction: SYSTEM_PROMPT,
          });

          const result = await model.generateContent(
            `Transform the website for the following user request:\n\n"${prompt}"`
          );

          const responseText = result.response.text();
          let cleanJson = responseText.trim();
          if (cleanJson.startsWith('```')) {
            cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
          }

          const parsedPlan: AITransformationPlan = JSON.parse(cleanJson);

          return NextResponse.json({
            success: true,
            source: 'gemini',
            model: modelName,
            plan: parsedPlan,
          });
        } catch (geminiErr: any) {
          console.warn(`[Gemini Transform API] Model ${modelName} call failed:`, geminiErr?.message || geminiErr);
        }
      }
    }

    // 2. Fallback to local heuristic engine (guaranteed zero-downtime)
    const fallbackPlan = AIEngine.generateTransformation(prompt);
    return NextResponse.json({
      success: true,
      source: 'heuristic_engine',
      plan: fallbackPlan,
    });
  } catch (err: any) {
    console.error('[AI Transform API Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to process AI transformation' },
      { status: 500 }
    );
  }
}

