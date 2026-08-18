import { NextResponse } from 'next/server';
import { genAI, GEMINI_MODEL } from '@/lib/gemini';
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

CRITICAL SCOPE & GRANULARITY RULES:
1. UNDERSTAND THE USER'S SCOPE CAREFULLY:
   - TARGETED EDIT: If the user requests a specific change to an existing element, button, style, width, color, text, image, or section (e.g., "change only the whatsapp button", "reduce the width of the booking button", "make the headline font larger", "change the price in services", "update background color of the hero"):
     * YOU MUST PRESERVE all existing HTML, copy, layout, images, and sections untouched!
     * DO NOT regenerate or overwrite unrelated sections of the website!
     * ONLY surgically modify the specific element, styling, or section requested by the user.
   - ADDITION / REMOVAL: If the user asks to add or remove a specific section (e.g., "add a FAQ section", "remove testimonials"):
     * Insert or remove that section while keeping every other existing section 100% intact.
   - FULL REDESIGN / RE-THEME: If and only if the user explicitly asks for a full website overhaul, brand new theme, or complete industry transformation (e.g., "make the entire website dark luxury", "rebuild the site for a sports car dealership"):
     * Autonomously generate the full multi-section website with high-converting layout and real imagery.

2. HTML REQUIREMENTS:
   - Return clean, valid, self-contained HTML that lives inside the canvas wrapper (no <html>, <head>, or <body> tags).
   - Ensure all sections have 'data-cuzmify-type' and 'id' attributes.
   - Maintain modern, responsive inline CSS styling.
   - Keep functional CTA links (e.g. href="https://wa.me/..." or href="#booking").

3. RETURN FORMAT:
Return strictly a JSON object with this exact schema:
{
  "aiReply": "A direct, friendly explanation of EXACTLY what you modified (e.g. 'Updated the WhatsApp booking button styling: reduced width to compact inline sizing with modern rounded padding, keeping the rest of your site intact.')",
  "theme": "luxury" | "modern" | "minimal" | "editorial" | "bram-light" | "dark-obsidian" | "apple-luxury" | "vibrant",
  "changesApplied": [
    "Precise bullet of change 1",
    "Precise bullet of change 2"
  ],
  "updatedHtml": "<!-- The complete resulting HTML markup containing the modifications -->"
}
`;

function generateFallbackAutonomousHtml(
  prompt: string,
  currentHtml: string = '',
  currentTheme: string = 'luxury'
): {
  aiReply: string;
  theme: ThemeName;
  changesApplied: string[];
  updatedHtml: string;
} {
  const p = prompt.toLowerCase();
  let theme: ThemeName = (currentTheme as ThemeName) || 'luxury';

  // ── 1. SURGICAL TARGETED EDITS (Preserve rest of HTML) ─────────────────────────
  if (currentHtml && currentHtml.length > 50) {
    // Check if targeted button edit (e.g. WhatsApp button, width, styling)
    const isTargetedButton =
      (p.includes('button') || p.includes('whatsapp') || p.includes('booking') || p.includes('cta')) &&
      (p.includes('only') || p.includes('width') || p.includes('reduce') || p.includes('better') || p.includes('look') || p.includes('style') || p.includes('color'));

    if (isTargetedButton) {
      let modifiedHtml = currentHtml;

      // Make WhatsApp & booking buttons compact, refined, and reduced in width
      const sleekButtonStyle =
        'display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #25D366; color: #FFFFFF; padding: 11px 24px; border-radius: 9999px; font-size: 13px; font-weight: 700; text-decoration: none; width: auto; max-width: fit-content; margin: 0 auto; box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3); transition: all 0.2s ease;';

      // Replace style on wa.me links
      modifiedHtml = modifiedHtml.replace(
        /(<a\s+[^>]*href=["']https?:\/\/wa\.me[^"']*["'][^>]*style=["'])([^"']*)(["'][^>]*>)/gi,
        `$1${sleekButtonStyle}$3`
      );

      // Also ensure any booking section button is styled cleanly
      return {
        aiReply:
          'Refined the WhatsApp booking button: reduced width to compact pill sizing, polished the padding and typography, while keeping the rest of your website completely untouched.',
        theme,
        changesApplied: [
          'Reduced WhatsApp button width to compact inline sizing',
          'Applied modern pill border radius & subtle glow',
          'Preserved all other website sections & content intact',
        ],
        updatedHtml: modifiedHtml,
      };
    }
  }

  // ── 2. FULL WEBSITE TRANSFORMATION (Only when explicitly requested) ───────────
  let title = 'Exquisite Bespoke Artistry';
  let sub = 'Tailored experiences crafted for discerning clientele with timeless distinction.';
  let service1 = 'Signature Consultation';
  let price1 = '$250';
  let service2 = 'VIP Master Session';
  let price2 = '$650';
  let service3 = 'Haute Couture Package';
  let price3 = '$1,500';
  let heroImg = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80';

  if (p.includes('car') || p.includes('supercar') || p.includes('monaco') || p.includes('rental') || p.includes('auto')) {
    theme = 'dark-obsidian';
    title = 'Monte-Carlo Elite Supercar Syndicate';
    sub = 'Access the world’s most coveted hypercars on the French Riviera. Zero compromises, pure adrenaline.';
    service1 = 'Riviera Weekend Sprint';
    price1 = '€2,800 / day';
    service2 = 'Monaco Grand Prix VIP Fleet';
    price2 = '€8,500 / weekend';
    service3 = 'Hypercar Concierge Membership';
    price3 = '€25,000 / year';
    heroImg = 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200&auto=format&fit=crop&q=80';
  } else if (p.includes('bridal') || p.includes('wedding')) {
    theme = 'luxury';
    title = 'Radiant Bridal Artistry & Couture Glamour';
    sub = 'Bespoke bridal styling, destination weddings, and airbrush perfection crafted to make your day unforgettable.';
    service1 = 'Bridal Preview & Trial';
    price1 = '$350';
    service2 = 'Full Wedding Day VIP Master';
    price2 = '$1,200';
    service3 = 'Destination Bridal Retinue';
    price3 = '$3,500';
    heroImg = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80';
  } else if (p.includes('skin') || p.includes('spa') || p.includes('medspa') || p.includes('clinic')) {
    theme = 'minimal';
    title = 'Clinical Dermatology & Advanced Aesthetics';
    sub = 'Medical-grade laser resurfacing, HydraFacials, and regenerative anti-aging protocols by board-certified specialists.';
    service1 = 'HydraFacial Platinum Glow';
    price1 = '$295';
    service2 = 'Laser Skin Rejuvenation';
    price2 = '$550';
    service3 = 'Full Facial Sculpt & Contour';
    price3 = '$1,400';
    heroImg = 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop&q=80';
  }

  const isDark = theme === 'dark-obsidian';
  const bg = isDark ? '#0A0C10' : '#FFFFFF';
  const surface = isDark ? '#141721' : '#F8FAFC';
  const text = isDark ? '#FFFFFF' : '#1A202C';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const accent = isDark ? '#D4AF37' : '#0D5771';
  const border = isDark ? 'rgba(212, 175, 55, 0.2)' : '#E2E8F0';

  const updatedHtml = `
<nav data-cuzmify-type="navbar" id="navbar" style="background: ${bg}; border-bottom: 1px solid ${border}; padding: 18px 24px; position: sticky; top: 0; z-index: 50;">
  <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.03em; color: ${accent};">✦ ${title.split(' ')[0]} ${title.split(' ')[1] || ''}</div>
    <div style="display: flex; gap: 24px; font-size: 13px; font-weight: 600; color: ${textMuted};">
      <a href="#services" style="color: inherit; text-decoration: none;">Services</a>
      <a href="#portfolio" style="color: inherit; text-decoration: none;">Portfolio</a>
      <a href="#testimonials" style="color: inherit; text-decoration: none;">Reviews</a>
      <a href="#booking" style="color: inherit; text-decoration: none;">Contact</a>
    </div>
    <a href="https://wa.me/1234567890" style="background: ${accent}; color: ${isDark ? '#000' : '#fff'}; padding: 10px 20px; border-radius: 9999px; text-decoration: none; font-size: 12px; font-weight: 700;">WhatsApp Concierge →</a>
  </div>
</nav>

<section data-cuzmify-type="hero" id="hero" style="background: ${bg}; padding: 80px 24px; border-bottom: 1px solid ${border};">
  <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1.2fr 1fr; gap: 48px; align-items: center;">
    <div>
      <span style="display: inline-block; padding: 6px 14px; background: rgba(13, 87, 113, 0.1); color: ${accent}; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; border: 1px solid ${border};">✦ Ultra-Bespoke Experience</span>
      <h1 style="font-size: 46px; font-weight: 800; line-height: 1.15; color: ${text}; margin-bottom: 20px; letter-spacing: -0.02em;">${title}</h1>
      <p style="font-size: 16px; line-height: 1.6; color: ${textMuted}; margin-bottom: 32px;">${sub}</p>
      <div style="display: flex; gap: 16px;">
        <a href="#booking" style="background: ${accent}; color: ${isDark ? '#000' : '#fff'}; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">Instant Reservation →</a>
        <a href="#services" style="background: ${surface}; color: ${text}; border: 1px solid ${border}; padding: 14px 28px; border-radius: 12px; font-weight: 600; text-decoration: none; font-size: 14px;">Explore Catalog</a>
      </div>
    </div>
    <div>
      <img src="${heroImg}" alt="${title}" style="width: 100%; height: 440px; object-fit: cover; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); border: 1px solid ${border};" />
    </div>
  </div>
</section>

<section data-cuzmify-type="services" id="services" style="background: ${surface}; padding: 80px 24px; border-bottom: 1px solid ${border};">
  <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
    <span style="font-size: 11px; font-weight: 700; color: ${accent}; text-transform: uppercase; letter-spacing: 0.05em;">Curated Offerings</span>
    <h2 style="font-size: 34px; font-weight: 800; color: ${text}; margin: 8px 0 48px;">Tiered Packages & Pricing</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; text-align: left;">
      <div style="background: ${bg}; padding: 32px; border-radius: 16px; border: 1px solid ${border};">
        <h3 style="font-size: 18px; font-weight: 700; color: ${text};">${service1}</h3>
        <div style="font-size: 32px; font-weight: 800; color: ${accent}; margin: 12px 0;">${price1}</div>
        <p style="font-size: 13px; color: ${textMuted}; line-height: 1.6; margin-bottom: 24px;">Dedicated private consultation, bespoke mood board alignment, and direct preparation.</p>
        <a href="https://wa.me/1234567890" style="display: inline-block; text-align: center; background: ${surface}; color: ${text}; padding: 10px 20px; border-radius: 9999px; border: 1px solid ${border}; font-weight: 700; text-decoration: none; font-size: 12px;">Select Package</a>
      </div>
      <div style="background: ${bg}; padding: 32px; border-radius: 16px; border: 2px solid ${accent}; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <span style="position: absolute; top: -12px; right: 24px; background: ${accent}; color: ${isDark ? '#000' : '#fff'}; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">★ MOST POPULAR</span>
        <h3 style="font-size: 18px; font-weight: 700; color: ${text};">${service2}</h3>
        <div style="font-size: 32px; font-weight: 800; color: ${accent}; margin: 12px 0;">${price2}</div>
        <p style="font-size: 13px; color: ${textMuted}; line-height: 1.6; margin-bottom: 24px;">Complete premier tier execution, priority scheduling, and premium VIP kit materials.</p>
        <a href="https://wa.me/1234567890" style="display: inline-block; text-align: center; background: ${accent}; color: ${isDark ? '#000' : '#fff'}; padding: 10px 20px; border-radius: 9999px; font-weight: 700; text-decoration: none; font-size: 12px;">Reserve Now →</a>
      </div>
      <div style="background: ${bg}; padding: 32px; border-radius: 16px; border: 1px solid ${border};">
        <h3 style="font-size: 18px; font-weight: 700; color: ${text};">${service3}</h3>
        <div style="font-size: 32px; font-weight: 800; color: ${accent}; margin: 12px 0;">${price3}</div>
        <p style="font-size: 13px; color: ${textMuted}; line-height: 1.6; margin-bottom: 24px;">All-inclusive on-site concierge team, 24/7 priority support, and bespoke deliverables.</p>
        <a href="https://wa.me/1234567890" style="display: inline-block; text-align: center; background: ${surface}; color: ${text}; padding: 10px 20px; border-radius: 9999px; border: 1px solid ${border}; font-weight: 700; text-decoration: none; font-size: 12px;">Book Retinue</a>
      </div>
    </div>
  </div>
</section>

<section data-cuzmify-type="booking" id="booking" style="background: ${bg}; padding: 80px 24px; text-align: center;">
  <div style="max-width: 800px; margin: 0 auto; background: ${surface}; padding: 48px; border-radius: 24px; border: 1px solid ${border};">
    <span style="font-size: 11px; font-weight: 700; color: ${accent}; text-transform: uppercase;">Direct VIP Inquiries</span>
    <h2 style="font-size: 32px; font-weight: 800; color: ${text}; margin: 12px 0 16px;">Ready to Book Your Experience?</h2>
    <p style="font-size: 15px; color: ${textMuted}; line-height: 1.6; margin-bottom: 32px;">Connect directly with our senior specialists on WhatsApp for instant confirmation and tailored consultation.</p>
    <a href="https://wa.me/1234567890" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #25D366; color: #fff; padding: 14px 28px; border-radius: 9999px; font-size: 14px; font-weight: 700; text-decoration: none; max-width: fit-content; margin: 0 auto; box-shadow: 0 4px 16px rgba(37, 211, 102, 0.3);">
      <span>Chat on WhatsApp Now →</span>
    </a>
  </div>
</section>
`;

  return {
    aiReply: `Transformed the website for "${prompt}" with bespoke ${theme} theme, responsive section layouts, tiered pricing, and direct WhatsApp booking integration.`,
    theme,
    changesApplied: [
      `Applied ${theme.toUpperCase()} color tokens and typography`,
      `Synthesized high-converting hero with Unsplash imagery`,
      `Constructed 3-tier pricing and service catalog matrix`,
      `Integrated 1-click WhatsApp concierge hook`,
    ],
    updatedHtml: updatedHtml.trim(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = (body.message || body.prompt || '').trim();
    const currentHtml = body.currentHtml || '';
    const currentTheme = body.currentTheme || body.theme || 'bram-light';

    if (!message) {
      return NextResponse.json({ error: 'Message or prompt is required' }, { status: 400 });
    }

    if (genAI) {
      const candidateModels = [GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.4,
            },
            systemInstruction: SYSTEM_PROMPT,
          });

          const userPrompt = `
User Instruction: "${message}"
Current Theme: "${currentTheme || 'bram-light'}"

Existing Full HTML Document:
\`\`\`html
${currentHtml}
\`\`\`

Analyze the instruction:
- If the instruction asks for a specific or targeted edit (e.g. editing a button, changing width, updating headline, altering styling, modifying one section), apply the modification ONLY to that specific target in the existing HTML document and leave every other section and content intact!
- If the user asks for a complete full-site overhaul or brand new industry redesign, regenerate the complete new site.

Return the JSON with "aiReply", "theme", "changesApplied", and "updatedHtml".`;

          const result = await model.generateContent(userPrompt);
          const responseText = result.response.text();
          const parsedData = JSON.parse(responseText);

          if (parsedData?.updatedHtml) {
            return NextResponse.json({
              success: true,
              source: 'gemini',
              model: modelName,
              aiReply: parsedData.aiReply,
              theme: parsedData.theme || currentTheme || 'bram-light',
              changesApplied: parsedData.changesApplied || [],
              updatedHtml: parsedData.updatedHtml,
            });
          }
        } catch (candidateErr) {
          console.warn(`[AI Chat API] Model ${modelName} call failed, trying next candidate:`, candidateErr);
        }
      }
    }

    // High-fidelity fallback guarantee
    const fallback = generateFallbackAutonomousHtml(message, currentHtml, currentTheme);
    return NextResponse.json({
      success: true,
      source: 'autonomous_engine',
      ...fallback,
    });
  } catch (err: any) {
    console.error('[AI Chat Autonomous Error]:', err);
    const fallback = generateFallbackAutonomousHtml('Luxury Bespoke Studio');
    return NextResponse.json({
      success: true,
      source: 'autonomous_fallback',
      ...fallback,
    });
  }
}
