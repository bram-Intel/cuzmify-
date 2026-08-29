import { NextResponse } from 'next/server';
import { getGeminiClient, GEMINI_MODEL } from '@/lib/gemini';
import type { CurrencyCode, ServiceItem } from '@/core/blueprint-schema';

export const maxDuration = 60;

export interface AnalyzeProfileRequest {
  handle: string;
  businessName?: string;
  category?: string;
  currency?: CurrencyCode;
  captions?: string[];
}

export interface AnalyzeProfileResult {
  nicheDetected: string;
  confidenceScore: number;
  recommendedTemplate: string;
  customTagline: string;
  generatedServices: ServiceItem[];
  whatsappHook: string;
}

export async function POST(req: Request) {
  try {
    const body: AnalyzeProfileRequest = await req.json();
    const handle = body.handle || 'creator';
    const businessName = body.businessName || `${handle} Studio`;
    const category = body.category || 'Makeup Artists & Beauty';
    const currency: CurrencyCode = body.currency || 'USD';
    const captions = body.captions || [];

    const gemini = getGeminiClient();

    if (!gemini) {
      // Deterministic intelligent fallback
      return NextResponse.json(getDefaultAnalysis(handle, businessName, category, currency));
    }

    const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `You are Cuzmify's elite AI Creative Director & Business Strategist.
Analyze the following Instagram profile and post captions to determine the creator's exact commercial micro-niche, optimal website template, luxury tagline, service menu, and WhatsApp conversion greeting.

Input:
- Instagram Handle: @${handle}
- Business Name: ${businessName}
- Broad Category: ${category}
- Currency: ${currency}
- Extracted Post Captions:
${captions.length > 0 ? captions.slice(0, 8).map((c, i) => `${i + 1}. "${c}"`).join('\n') : 'No captions available; infer from category and handle.'}

Available Starter Templates:
- "BeautyPro Studio Suite" (for makeup, lashes, nails, aesthetics, spas, beauty studios)
- "Vogue Boutique & Catalog" (for fashion, apparel, hair bundles, custom wigs, accessories)
- "Couture Events & Planning" (for event planners, bridal decor, catering, party coordination)
- "Luxe Portrait & Studio Gallery" (for photographers, videographers, visual artists, studios)

Return a STRICT JSON object (no markdown, no backticks, only valid JSON) matching this exact schema:
{
  "nicheDetected": string (e.g. "Luxury Bridal & Red Carpet Glamour", "High-Definition Lash & Brow Architecture", "Custom Couture Wigs & Hair Extensions"),
  "confidenceScore": number (between 0.92 and 0.99),
  "recommendedTemplate": string (must be one of the 4 template names above),
  "customTagline": string (a punchy luxury one-sentence value proposition),
  "generatedServices": [
    {
      "id": string,
      "name": string,
      "price": number (realistic integer in ${currency}, e.g. if NGN 25000-150000, if USD 80-500, if GBP 60-400),
      "durationMinutes": number (30, 45, 60, 90, 120),
      "locationType": "in_studio" | "on_location" | "both",
      "description": string,
      "tag": string (e.g. "SIGNATURE", "BRIDAL", "VIP", "POPULAR"),
      "category": string,
      "enabled": true
    }
  ],
  "whatsappHook": string (e.g. "Hi ${businessName}! I saw your work on Instagram and would love to check your availability for...")
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsed: AnalyzeProfileResult = JSON.parse(cleanJson);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('[AI Analyze Profile Error]:', error);
    return NextResponse.json(getDefaultAnalysis('creator', 'Luxury Studio', 'Makeup Artists & Beauty', 'USD'));
  }
}

function getDefaultAnalysis(
  handle: string,
  businessName: string,
  category: string,
  currency: CurrencyCode
): AnalyzeProfileResult {
  const isNGN = currency === 'NGN';
  return {
    nicheDetected: 'Luxury Bridal & Red Carpet Glamour',
    confidenceScore: 0.96,
    recommendedTemplate: 'BeautyPro Studio Suite',
    customTagline: `Signature high-definition artistry and bespoke luxury styling by @${handle}.`,
    generatedServices: [
      {
        id: `srv-ai-1`,
        name: 'Signature Bespoke Glam',
        price: isNGN ? 45000 : 150,
        durationMinutes: 60,
        locationType: 'in_studio',
        description: 'Complete high-definition beauty styling tailored for private events and luxury outings.',
        tag: 'POPULAR',
        category: 'Glamour',
        enabled: true,
      },
      {
        id: `srv-ai-2`,
        name: 'Royal Bridal & Wedding Suite',
        price: isNGN ? 140000 : 450,
        durationMinutes: 120,
        locationType: 'on_location',
        description: 'Includes comprehensive bridal preview trial, 24hr HD airbrushing, and on-location touchup kit.',
        tag: 'BRIDAL',
        category: 'Bridal',
        enabled: true,
      },
      {
        id: `srv-ai-3`,
        name: 'Editorial & Red Carpet Artistry',
        price: isNGN ? 85000 : 275,
        durationMinutes: 90,
        locationType: 'flexible',
        description: 'Camera-ready flawless skin prep and high-contrast contouring for photoshoots and galas.',
        tag: 'SIGNATURE',
        category: 'Editorial',
        enabled: true,
      },
    ],
    whatsappHook: `Hello ${businessName}! I saw your portfolio on Instagram and would love to check your availability for an upcoming booking.`,
  };
}
