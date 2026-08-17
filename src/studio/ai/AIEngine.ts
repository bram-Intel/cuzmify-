import type { ThemeName } from '@/core/project-schema';

export interface AITransformationPlan {
  theme?: ThemeName;
  heroHeadline?: string;
  heroSubheadline?: string;
  heroBadge?: string;
  heroCtaText?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  aboutBadge?: string;
  servicesTitle?: string;
  services?: Array<{ name: string; price: string; description: string; tag?: string }>;
  galleryTitle?: string;
  galleryBadge?: string;
  bookingTitle?: string;
  bookingCta?: string;
  testimonialsTitle?: string;
  testimonials?: Array<{ quote: string; author: string; location?: string }>;
  ctaHeadline?: string;
  ctaSubheadline?: string;
  ctaButtonText?: string;
  sectionsToAdd?: string[];
  summary: string;
  nicheDetected: string;
  toneDetected: string;
}

export interface InlineRewriteResult {
  original: string;
  transformed: string;
  action: string;
  variations?: string[];
}

export class AIEngine {
  // ── Global Full-Site Transformation ───────────────────────────────────────
  static generateTransformation(prompt: string): AITransformationPlan {
    const p = prompt.toLowerCase();

    // 1. Niche Detection
    let niche = 'Beauty & Artistry';
    if (p.includes('bridal') || p.includes('wedding') || p.includes('bride')) {
      niche = 'Bridal & Destination Weddings';
    } else if (p.includes('luxury') || p.includes('dubai') || p.includes('gold') || p.includes('exclusive') || p.includes('vip')) {
      niche = 'Ultra-Luxury VIP Artistry';
    } else if (p.includes('barber') || p.includes('groom') || p.includes('men') || p.includes('fade')) {
      niche = 'Gentlemen Barber Lounge';
    } else if (p.includes('spa') || p.includes('skin') || p.includes('medspa') || p.includes('derma') || p.includes('facial')) {
      niche = 'Medical Aesthetic & Skin Clinic';
    } else if (p.includes('hair') || p.includes('extension') || p.includes('wig') || p.includes('salon')) {
      niche = 'Luxury Hair & Extensions Studio';
    } else if (p.includes('tech') || p.includes('app') || p.includes('software') || p.includes('ai')) {
      niche = 'AI & Creative Tech Studio';
    } else if (p.includes('fitness') || p.includes('gym') || p.includes('coach') || p.includes('trainer')) {
      niche = 'High-Performance Fitness Studio';
    } else if (p.includes('bakery') || p.includes('cake') || p.includes('cafe') || p.includes('pastry')) {
      niche = 'Artisan Patisserie & Bakery';
    }

    // 2. Tone & Theme Selection
    let theme: ThemeName = 'bram-light';
    let tone = 'Elevated & Professional';

    if (p.includes('dark') || p.includes('obsidian') || p.includes('night') || p.includes('cyber') || p.includes('black')) {
      theme = 'dark-obsidian';
      tone = 'Cinematic & High-Contrast';
    } else if (p.includes('luxury') || p.includes('gold') || p.includes('expensive') || p.includes('royal') || p.includes('dubai')) {
      theme = 'luxury';
      tone = 'Opulent & Bespoke';
    } else if (p.includes('minimal') || p.includes('clean') || p.includes('simple') || p.includes('swiss')) {
      theme = 'minimal';
      tone = 'Clean & Editorial Minimalist';
    } else if (p.includes('editorial') || p.includes('vogue') || p.includes('magazine') || p.includes('fashion')) {
      theme = 'editorial';
      tone = 'High-Fashion Editorial';
    } else if (p.includes('vibrant') || p.includes('pink') || p.includes('playful') || p.includes('fun') || p.includes('gen-z')) {
      theme = 'vibrant';
      tone = 'Playful, Vibrant & Gen-Z';
    } else if (p.includes('apple') || p.includes('sleek') || p.includes('tech luxury')) {
      theme = 'apple-luxury';
      tone = 'Apple-Grade Precision';
    } else if (p.includes('modern') || p.includes('indigo') || p.includes('contemporary')) {
      theme = 'modern';
      tone = 'Modern Contemporary';
    }

    // 3. Synthesize Niche-Specific Copy & Sections
    if (niche === 'Bridal & Destination Weddings') {
      return {
        theme,
        nicheDetected: niche,
        toneDetected: tone,
        summary: `Refocused entire site for bridal & wedding elegance with tailored headline, bespoke bridal packages, and warm romantic aesthetic.`,
        heroHeadline: 'Bespoke Bridal Elegance for Your Most Unforgettable Day',
        heroSubheadline: 'World-class bridal hair and makeup artistry. Flawless 24-hour airbrushing, veil styling, and on-location luxury concierge for brides worldwide.',
        heroBadge: '✦ World-Renowned Bridal Artistry',
        heroCtaText: '✦ Reserve Bridal Date →',
        aboutTitle: 'Crafting Timeless Radiance for Over 1,500 Brides',
        aboutDescription: 'From intimate destination ceremonies in Lake Como to grand ballrooms, our master artists create luminous, photo-ready perfection that lasts from first look to final dance.',
        aboutBadge: 'Bridal Heritage',
        servicesTitle: 'Curated Bridal Suites & Packages',
        services: [
          { name: 'Royal Platinum Bridal Suite', price: '$550', description: 'Complete bridal preview trial, 24hr HD airbrush makeup, couture hair design, silk lashes, and touch-up kit.', tag: 'SIGNATURE' },
          { name: 'Destination Bridal Concierge', price: '$1,200', description: 'Full-day dedicated on-location artist for morning ceremony, reception restyling, and party glam.', tag: 'VIP' },
          { name: 'Bridal Party & Maid of Honor', price: '$175', description: 'Cohesive soft glam makeup and elegant waves for bridesmaids, mothers, and special guests.', tag: 'GROUP' },
          { name: 'Bridal Trial & Skin Prep Session', price: '$220', description: '90-minute consultation with bespoke skincare diagnosis, custom lash mapping, and photography lighting check.', tag: 'POPULAR' },
        ],
        galleryTitle: 'Real Brides & Wedding Artistry',
        galleryBadge: 'Couture Portfolio',
        bookingTitle: 'Reserve Your Wedding Date',
        bookingCta: 'Inquire Availability via WhatsApp',
        testimonialsTitle: 'Love Notes from Our Brides',
        testimonials: [
          { quote: 'My makeup stayed 100% flawless through tears, dancing, and 12 hours in the summer heat. I felt breathtaking.', author: 'Elena Rostova — Lake Como Bride' },
          { quote: 'The calmest, most luxurious morning of my life. Booking Gmakeup Studio was the best wedding decision we made.', author: 'Sophie & Marc — London' },
        ],
        ctaHeadline: 'Your Dream Wedding Look Begins Here',
        ctaSubheadline: 'Dates fill up 6 to 12 months in advance. Secure your consultation today.',
        ctaButtonText: 'Book Wedding Consultation →',
        sectionsToAdd: ['cuzmify-testimonials', 'cuzmify-cta'],
      };
    }

    if (niche === 'Ultra-Luxury VIP Artistry') {
      return {
        theme: 'luxury',
        nicheDetected: niche,
        toneDetected: 'Opulent & Bespoke',
        summary: `Elevated site to Ultra-Luxury VIP standard with gold accents, exclusive celebrity styling tiers, and high-contrast editorial typography.`,
        heroHeadline: 'Exquisite Glamour & Bespoke Artistry for Discerning Clients',
        heroSubheadline: 'Private VIP makeup concierge, red-carpet styling, and private estate appointments for celebrities, galas, and luxury editorial shoots.',
        heroBadge: '✦ Haute Couture Luxury Studio',
        heroCtaText: '✦ Book VIP Private Session →',
        aboutTitle: 'The Pinnacle of Haute Couture Transformation',
        aboutDescription: 'Serving exclusive clienteles across private jets, film festivals, and luxury galas. Every application is custom-formulated using bespoke French skincare and micro-pigment artistry.',
        aboutBadge: 'Private Concierge',
        servicesTitle: 'VIP Concierge & Red Carpet Menu',
        services: [
          { name: 'Red Carpet Gala Haute Glam', price: '$450', description: 'Sculpted high-definition makeup, custom diamond dust highlight, bespoke brow architecture, and luxury lashes.', tag: 'RED CARPET' },
          { name: 'Private Estate & Yacht Callout', price: '$1,800', description: 'Full-day on-site beauty artist on call for all wardrobe changes, editorial lighting, and continuous touch-ups.', tag: 'EXCLUSIVE' },
          { name: 'Editorial Campaign Master Direction', price: '$850', description: 'Concept moodboarding, creative look execution, and skin prep for magazine covers and high-fashion looks.', tag: 'STUDIO' },
          { name: '24K Gold Luxury Skin Infusion & Glam', price: '$620', description: 'Pre-event micro-hydration lymphatic massage followed by pure 24k gold leaf skin prep and radiant beauty.', tag: 'SIGNATURE' },
        ],
        galleryTitle: 'Private Red Carpet & High-Fashion Looks',
        galleryBadge: 'Vogue & Film Highlights',
        bookingTitle: 'VIP Private Inquiries',
        bookingCta: 'Connect with Artist Concierge on WhatsApp',
        testimonialsTitle: 'Client Testimonials & Press',
        testimonials: [
          { quote: 'Unmatched precision and absolute discretion. The only team I trust for international film premieres.', author: 'Victoria H. — Celebrity Stylist, Paris' },
          { quote: 'Pure artistry. My skin looked luminous and retouched in 8K camera lenses without feeling heavy.', author: 'Chloe M. — Cannes Film Festival' },
        ],
        ctaHeadline: 'Experience Uncompromised Luxury',
        ctaSubheadline: 'Private bookings available globally by appointment only.',
        ctaButtonText: 'Inquire Private Booking →',
        sectionsToAdd: ['cuzmify-testimonials', 'cuzmify-cta'],
      };
    }

    if (niche === 'Medical Aesthetic & Skin Clinic') {
      return {
        theme: 'minimal',
        nicheDetected: niche,
        toneDetected: 'Clinical & Minimalist',
        summary: `Refreshed website into a Medical Aesthetic & Dermatological Clinic with certified clinical protocols, treatment menus, and clean physician-grade layout.`,
        heroHeadline: 'Advanced Aesthetic Medicine & Clinical Skin Rejuvenation',
        heroSubheadline: 'Physician-led clinical aesthetics, HydraFacials, medical-grade peels, and non-surgical facial harmonization designed for natural, radiant results.',
        heroBadge: '✦ Certified Medical Aesthetics',
        heroCtaText: '✦ Book Clinical Consultation →',
        aboutTitle: 'Science-Backed Skincare & Precision Aesthetics',
        aboutDescription: 'Our clinic merges medical dermatology with luxury wellness. Led by certified aesthetic practitioners with over 15 years in clinical laser therapy and facial rejuvenation.',
        aboutBadge: 'Clinical Excellence',
        servicesTitle: 'Advanced Clinical Treatments',
        services: [
          { name: 'Signature HydraFacial MD & Lymphatic', price: '$280', description: 'Deep pore vacuum extraction, antioxidant infusion, LED light therapy, and peptide barrier restoration.', tag: 'BESTSELLER' },
          { name: 'Microneedling & Exosome Therapy', price: '$420', description: 'Collagen induction therapy paired with regenerative exosome serum for deep texture renewal and scar reduction.', tag: 'ADVANCED' },
          { name: 'Custom Medical Chemical Peel', price: '$195', description: 'Targeted TCA and salicylic blend for hyperpigmentation, sun damage, and instant glass-skin resurfacing.', tag: 'POPULAR' },
          { name: 'Comprehensive Skin Analysis & Plan', price: '$120', description: '3D UV skin scan mapping pore health, sebum balance, and moisture depth with a custom treatment roadmap.', tag: 'CONSULTATION' },
        ],
        galleryTitle: 'Verified Clinical Results',
        galleryBadge: 'Before & After Transformations',
        bookingTitle: 'Schedule Your Consultation',
        bookingCta: 'Book via Clinical WhatsApp Hotline',
        testimonialsTitle: 'Patient Reviews & Results',
        testimonials: [
          { quote: 'Completely transformed my stubborn hyperpigmentation in 3 sessions. The clinical expertise here is unmatched.', author: 'Dr. Amanda S. — Patient' },
          { quote: 'Natural, glowing results without looking overdone. I trust this clinic with my face completely.', author: 'Rochelle K. — Regular Client' },
        ],
        ctaHeadline: 'Begin Your Healthy Skin Journey',
        ctaSubheadline: 'Consult with our licensed aesthetic physicians today.',
        ctaButtonText: 'Book Your First Session →',
        sectionsToAdd: ['cuzmify-testimonials', 'cuzmify-cta'],
      };
    }

    // Default High-Converting Universal Transformation
    return {
      theme,
      nicheDetected: niche,
      toneDetected: tone,
      summary: `Applied ${tone} styling with high-converting headline, restructured service catalog, and direct WhatsApp reservation points.`,
      heroHeadline: 'Elevating High-Fashion Artistry & Bespoke Elegance',
      heroSubheadline: 'World-class beauty transformations, flawless 24hr airbrushing, and tailored styling for red carpet, weddings, and editorial campaigns.',
      heroBadge: '✦ Master Artistry Studio',
      heroCtaText: '✦ Reserve Your Session →',
      aboutTitle: 'Mastering the Art of Flawless Transformation',
      aboutDescription: 'Combining luxury French skincare prep with cutting-edge micro-contouring techniques, our master artists create unforgettable beauty experiences for every client.',
      aboutBadge: 'About Our Artistry',
      servicesTitle: 'Curated Beauty Experiences',
      services: [
        { name: 'Royal Platinum Glam Suite', price: '$380', description: 'Complete beauty preview trial, 24hr HD airbrush makeup, silk lashes, and touch-up kit.', tag: 'SIGNATURE' },
        { name: 'Red Carpet Soft Glam', price: '$190', description: 'Radiant skin-focused makeup with soft contouring, neutral warm tones, and lash application.', tag: 'POPULAR' },
        { name: 'Hollywood Waves & Crown Updo', price: '$230', description: 'Signature red-carpet waves or intricate updo with scalp prep and long-lasting shine seal.', tag: 'HAIRSTYLE' },
        { name: 'Private 1-on-1 Pro Masterclass', price: '$450', description: '3-hour private masterclass on personal contouring, color theory, and everyday luxury routines.', tag: 'EDUCATION' },
      ],
      galleryTitle: 'Recent Studio Portfolio',
      galleryBadge: 'Live Work Gallery',
      bookingTitle: 'Book Your Appointment',
      bookingCta: 'Send Instant WhatsApp Booking',
      testimonialsTitle: 'What Our Clients Say',
      testimonials: [
        { quote: 'Absolutely stunning work. My bridal look was exactly what I dreamed of. I felt like royalty!', author: 'Sarah K. — Bride' },
        { quote: 'The contouring and skin finish lasted all night without a single touch-up. Truly phenomenal artists.', author: 'Jessica T. — Fashion Model' },
      ],
      ctaHeadline: 'Ready to Transform Your Look?',
      ctaSubheadline: 'Book an exclusive session with our master artists today.',
      ctaButtonText: 'Book Your Glam Session →',
      sectionsToAdd: ['cuzmify-testimonials', 'cuzmify-cta'],
    };
  }

  // ── Inline Text Transformation Copilot ────────────────────────────────────
  static rewriteInlineText(
    text: string,
    action: 'polish' | 'punchy' | 'shorten' | 'whatsapp_hook' | 'tone_luxury' | 'tone_playful' | 'variations' | 'custom',
    customInstruction?: string
  ): InlineRewriteResult {
    const clean = text.trim();

    switch (action) {
      case 'polish': {
        const transformed = clean
          .replace(/nice|good|great/gi, 'exceptional')
          .replace(/best/gi, 'world-class')
          .replace(/make you look/gi, 'elevate your natural')
          .replace(/book/gi, 'reserve your private experience')
          .replace(/cheap/gi, 'accessible luxury');
        return {
          original: clean,
          action: 'Polished & Elevated',
          transformed: transformed.length > 5 ? transformed : `Exquisite ${clean} crafted with precision artistry.`,
        };
      }

      case 'punchy': {
        const words = clean.split(' ');
        if (words.length > 8) {
          return {
            original: clean,
            action: 'Made Punchy & Dynamic',
            transformed: words.slice(0, 6).join(' ') + ' — Refined.',
          };
        }
        return {
          original: clean,
          action: 'Made Punchy',
          transformed: `${clean} — Pure Impact.`,
        };
      }

      case 'shorten': {
        const words = clean.split(' ');
        const shortened = words.slice(0, Math.max(3, Math.floor(words.length * 0.6))).join(' ');
        return {
          original: clean,
          action: 'Shortened',
          transformed: shortened + (shortened.endsWith('.') ? '' : '.'),
        };
      }

      case 'whatsapp_hook': {
        return {
          original: clean,
          action: 'WhatsApp Conversion Hook',
          transformed: `💬 Quick WhatsApp Booking: ${clean} (Fast 5-Min Reply)`,
        };
      }

      case 'tone_luxury': {
        return {
          original: clean,
          action: 'Luxury Tone',
          transformed: `Bespoke ${clean} — Designed for Discerning Clients.`,
        };
      }

      case 'tone_playful': {
        return {
          original: clean,
          action: 'Playful Tone',
          transformed: `✨ Level up your glow with ${clean.toLowerCase()}! Let's get glam! 💖`,
        };
      }

      case 'variations': {
        return {
          original: clean,
          action: '3 Variations Generated',
          transformed: clean,
          variations: [
            `✦ Option 1 (Luxury): Elevating ${clean} with bespoke couture precision.`,
            `⚡ Option 2 (Punchy): ${clean} — Bold. Flawless. Unmatched.`,
            `💬 Option 3 (Conversion): ${clean} • Book directly on WhatsApp today.`,
          ],
        };
      }

      case 'custom': {
        const instr = (customInstruction || '').toLowerCase();
        let transformed = clean;
        if (instr.includes('shorter') || instr.includes('brief')) {
          transformed = clean.split(' ').slice(0, 5).join(' ') + '.';
        } else if (instr.includes('luxury') || instr.includes('elegant')) {
          transformed = `Exquisite ${clean} — Tailored for Perfection.`;
        } else if (instr.includes('emoji') || instr.includes('vibrant')) {
          transformed = `✨ ${clean} 💖 ✦`;
        } else {
          transformed = `✦ ${clean} — Enhanced with ${customInstruction}.`;
        }
        return {
          original: clean,
          action: `Custom: "${customInstruction}"`,
          transformed,
        };
      }
    }
  }

  // ── Async Gemini API Connectors (with automatic offline fallback) ─────────
  static async generateTransformationAsync(prompt: string): Promise<AITransformationPlan> {
    try {
      const res = await fetch('/api/ai/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data?.plan) {
        return data.plan;
      }
    } catch (err) {
      console.warn('[AIEngine] API call failed, using local engine fallback:', err);
    }

    // Fallback
    return this.generateTransformation(prompt);
  }

  static async rewriteInlineTextAsync(
    text: string,
    action: 'polish' | 'punchy' | 'shorten' | 'whatsapp_hook' | 'tone_luxury' | 'tone_playful' | 'variations' | 'custom',
    customInstruction?: string
  ): Promise<InlineRewriteResult> {
    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, action, customInstruction }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data?.result) {
        return data.result;
      }
    } catch (err) {
      console.warn('[AIEngine] Copilot API call failed, using local engine fallback:', err);
    }

    // Fallback
    return this.rewriteInlineText(text, action, customInstruction);
  }
}
