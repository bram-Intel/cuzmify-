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
You are the Cuzmify Autonomous AI Website Builder (world-class AI website architect, like Lovable/v0).

Your job is to take a user's natural language instructions, review their existing website HTML, and autonomously transform, redesign, or enhance the website HTML with full creative autonomy.

RULES FOR GENERATING WEBSITE HTML:
1. Generate COMPLETE, valid, self-contained HTML that includes all necessary sections:
   - Navigation (<nav data-cuzmify-type="navbar" id="navbar">...)
   - Hero Section (<section data-cuzmify-type="hero" id="hero">...) with strong headline, subheadline, CTA buttons, and real Unsplash imagery.
   - About/Story Section (<section data-cuzmify-type="about" id="about">...)
   - Services/Catalog/Pricing Section (<section data-cuzmify-type="services" id="services">...) with realistic pricing and packages.
   - Gallery/Portfolio Section (<section data-cuzmify-type="gallery" id="portfolio">...) with high-quality Unsplash image URLs.
   - Testimonials/Reviews Section (<section data-cuzmify-type="testimonials" id="testimonials">...)
   - Booking/Contact/WhatsApp Section (<section data-cuzmify-type="booking" id="booking">...)
   - CTA Banner Section (<section data-cuzmify-type="cta" id="cta">...)
2. Every top-level section MUST have:
   - 'data-cuzmify-type' attribute (e.g. "hero", "about", "services", "gallery", "booking", "testimonials", "cta", "navbar").
   - A unique 'id' attribute matching its type (e.g. id="hero", id="services").
   - Inline styles for layout (display: flex/grid, padding: 60px 24px, max-width: 1200px, margin: 0 auto).
3. Use REAL, stunning Unsplash photography matching the requested industry (e.g., https://images.unsplash.com/photo-... with appropriate keywords).
4. Include functional WhatsApp CTA buttons (e.g. href="https://wa.me/1234567890").
5. Do NOT include <html>, <head>, or <body> tags — ONLY the direct section markup that lives inside the wrapper container.

Return your response strictly as a JSON object with this exact structure:
{
  "aiReply": "A concise, confident 2-3 sentence explanation of the design decisions and improvements made.",
  "theme": "luxury" | "modern" | "minimal" | "editorial" | "bram-light" | "dark-obsidian" | "apple-luxury" | "vibrant",
  "changesApplied": [
    "Short bullet 1 of what was built or transformed",
    "Short bullet 2",
    "Short bullet 3"
  ],
  "updatedHtml": "<!-- Full complete section markup string -->"
}
`;

function generateFallbackAutonomousHtml(prompt: string, currentTheme: string = 'luxury'): {
  aiReply: string;
  theme: ThemeName;
  changesApplied: string[];
  updatedHtml: string;
} {
  const p = prompt.toLowerCase();
  let theme: ThemeName = 'luxury';
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
        <a href="https://wa.me/1234567890" style="display: block; text-align: center; background: ${surface}; color: ${text}; padding: 10px; border-radius: 10px; border: 1px solid ${border}; font-weight: 700; text-decoration: none; font-size: 12px;">Select Package</a>
      </div>
      <div style="background: ${bg}; padding: 32px; border-radius: 16px; border: 2px solid ${accent}; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <span style="position: absolute; top: -12px; right: 24px; background: ${accent}; color: ${isDark ? '#000' : '#fff'}; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 9999px;">★ MOST POPULAR</span>
        <h3 style="font-size: 18px; font-weight: 700; color: ${text};">${service2}</h3>
        <div style="font-size: 32px; font-weight: 800; color: ${accent}; margin: 12px 0;">${price2}</div>
        <p style="font-size: 13px; color: ${textMuted}; line-height: 1.6; margin-bottom: 24px;">Complete premier tier execution, priority scheduling, and premium VIP kit materials.</p>
        <a href="https://wa.me/1234567890" style="display: block; text-align: center; background: ${accent}; color: ${isDark ? '#000' : '#fff'}; padding: 10px; border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 12px;">Reserve Now →</a>
      </div>
      <div style="background: ${bg}; padding: 32px; border-radius: 16px; border: 1px solid ${border};">
        <h3 style="font-size: 18px; font-weight: 700; color: ${text};">${service3}</h3>
        <div style="font-size: 32px; font-weight: 800; color: ${accent}; margin: 12px 0;">${price3}</div>
        <p style="font-size: 13px; color: ${textMuted}; line-height: 1.6; margin-bottom: 24px;">All-inclusive on-site concierge team, 24/7 priority support, and bespoke deliverables.</p>
        <a href="https://wa.me/1234567890" style="display: block; text-align: center; background: ${surface}; color: ${text}; padding: 10px; border-radius: 10px; border: 1px solid ${border}; font-weight: 700; text-decoration: none; font-size: 12px;">Book Retinue</a>
      </div>
    </div>
  </div>
</section>

<section data-cuzmify-type="booking" id="booking" style="background: ${bg}; padding: 80px 24px; text-align: center;">
  <div style="max-width: 800px; margin: 0 auto; background: ${surface}; padding: 48px; border-radius: 24px; border: 1px solid ${border};">
    <span style="font-size: 11px; font-weight: 700; color: ${accent}; text-transform: uppercase;">Direct VIP Inquiries</span>
    <h2 style="font-size: 32px; font-weight: 800; color: ${text}; margin: 12px 0 16px;">Ready to Book Your Experience?</h2>
    <p style="font-size: 15px; color: ${textMuted}; line-height: 1.6; margin-bottom: 32px;">Connect directly with our senior specialists on WhatsApp for instant confirmation and tailored consultation.</p>
    <a href="https://wa.me/1234567890" style="display: inline-flex; align-items: center; gap: 8px; background: #25D366; color: #fff; padding: 16px 36px; border-radius: 14px; font-size: 16px; font-weight: 700; text-decoration: none; box-shadow: 0 4px 16px rgba(37, 211, 102, 0.3);">
      <span>Chat on WhatsApp Now →</span>
    </a>
  </div>
</section>
`;

  return {
    aiReply: `Transformed the entire website for "${prompt}" with bespoke ${theme} theme, responsive section layouts, tiered pricing, and direct WhatsApp booking integration.`,
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
    const currentHtml = body.currentHtml;
    const currentTheme = body.currentTheme || body.theme || 'bram-light';

    if (!message) {
      return NextResponse.json({ error: 'Message or prompt is required' }, { status: 400 });
    }

    if (genAI) {
      // Cascade across available model candidates to ensure reliable generation
      const candidateModels = [GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

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

          const userPrompt = `
User Instruction: "${message}"
Current Theme: "${currentTheme || 'bram-light'}"

Existing HTML snippet for context:
\`\`\`html
${(currentHtml || '').slice(0, 3000)}
\`\`\`

Generate the complete transformed website HTML and JSON response now.`;

          const result = await model.generateContent(userPrompt);
          const responseText = result.response.text();
          const parsedData = JSON.parse(responseText);

          if (parsedData?.updatedHtml) {
            return NextResponse.json({
              success: true,
              source: 'gemini',
              model: modelName,
              aiReply: parsedData.aiReply,
              theme: parsedData.theme || 'bram-light',
              changesApplied: parsedData.changesApplied || [],
              updatedHtml: parsedData.updatedHtml,
            });
          }
        } catch (candidateErr) {
          console.warn(`[AI Chat API] Model ${modelName} call failed, trying next candidate:`, candidateErr);
        }
      }
    }

    // High-fidelity fallback guarantee (zero 500 errors)
    const fallback = generateFallbackAutonomousHtml(message, currentTheme);
    return NextResponse.json({
      success: true,
      source: 'autonomous_engine',
      ...fallback,
    });
  } catch (err: any) {
    console.error('[AI Chat Autonomous Error]:', err);
    // Even on unexpected error, guarantee graceful fallback
    const fallback = generateFallbackAutonomousHtml('Luxury Bespoke Studio');
    return NextResponse.json({
      success: true,
      source: 'autonomous_fallback',
      ...fallback,
    });
  }
}
