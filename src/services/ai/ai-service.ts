import { AIThemeConfig, BusinessCategory } from '@/core/types';

export interface AIPresetPrompt {
  id: string;
  label: string;
  badge: string;
  prompt: string;
  description: string;
}

export const CURATED_AI_PROMPTS: AIPresetPrompt[] = [
  {
    id: 'apple',
    label: '🍏 Apple Fluid Luxury',
    badge: 'GLASS & BLUR',
    prompt: 'Apple luxury glassmorphism style with SF font, soft blurs, and clean minimal white-slate theme',
    description: 'Ultra-refined translucent glass cards with smooth physical typography',
  },
  {
    id: 'google',
    label: '🌐 Google Material 3',
    badge: 'TONAL & PILLS',
    prompt: 'Google material design style with soft tonal HSL colors, pill buttons, and spacious cards',
    description: 'Adaptive color extraction, rounded pill controls, and clean Google spacing',
  },
  {
    id: 'bram',
    label: '💎 Bram Intel Light',
    badge: 'TEAL & SKY BLUE',
    prompt: 'Bram Intel signature light theme with pure white background, surface grey, deep teal, and sky blue accents',
    description: 'Our signature high-discipline light architecture with subpixel vector grids',
  },
  {
    id: 'obsidian',
    label: '🖤 Dark Obsidian Glow',
    badge: 'CYBER LUXURY',
    prompt: 'Dark obsidian theme with neon teal glow, gold accents, and deep dark background',
    description: 'High-contrast luxury dark theme with glowing border beams and golden highlights',
  },
  {
    id: 'editorial',
    label: '✨ Vogue Editorial Magazine',
    badge: 'HIGH CONTRAST',
    prompt: 'Editorial magazine layout with serif/display typography, high contrast, and warm gold highlights',
    description: 'High-fashion editorial layout designed for luxury portfolios and studios',
  },
];

export class AIService {
  /**
   * Generates or adapts an existing theme config using AI intent prompts.
   */
  static async customizeProject(
    currentConfig: AIThemeConfig,
    userPrompt: string
  ): Promise<AIThemeConfig> {
    const promptLower = userPrompt.toLowerCase();
    const newConfig: AIThemeConfig = { ...currentConfig };

    // 1. DESIGN LANGUAGE MATCHING
    if (promptLower.includes('apple') || promptLower.includes('glass') || promptLower.includes('fluid')) {
      newConfig.style = 'apple-luxury';
      newConfig.primaryColor = '#F8FAFC';
      newConfig.secondaryColor = '#0F172A';
      newConfig.accentColor = '#38BDF8';
      newConfig.fontFamily = 'Outfit';
    } else if (promptLower.includes('google') || promptLower.includes('material') || promptLower.includes('tonal')) {
      newConfig.style = 'google-material';
      newConfig.primaryColor = '#F1F5F9';
      newConfig.secondaryColor = '#1E293B';
      newConfig.accentColor = '#0284C7';
      newConfig.fontFamily = 'Inter';
    } else if (promptLower.includes('bram') || promptLower.includes('teal') || promptLower.includes('sky')) {
      newConfig.style = 'bram-light';
      newConfig.primaryColor = '#FFFFFF';
      newConfig.secondaryColor = '#0D5771';
      newConfig.accentColor = '#3498E3';
      newConfig.fontFamily = 'Outfit';
    } else if (promptLower.includes('obsidian') || promptLower.includes('cyber') || promptLower.includes('glow')) {
      newConfig.style = 'dark-obsidian';
      newConfig.primaryColor = '#071A24';
      newConfig.secondaryColor = '#38BDF8';
      newConfig.accentColor = '#F59E0B';
      newConfig.fontFamily = 'Space Grotesk';
    } else if (promptLower.includes('luxury') || promptLower.includes('gold') || promptLower.includes('vogue') || promptLower.includes('editorial')) {
      newConfig.style = 'luxury';
      newConfig.primaryColor = '#1C1917';
      newConfig.secondaryColor = '#F59E0B';
      newConfig.accentColor = '#FEF3C7';
      newConfig.fontFamily = 'Outfit';
    } else if (promptLower.includes('dark') || promptLower.includes('neon') || promptLower.includes('sleek')) {
      newConfig.style = 'dark-elegance';
      newConfig.primaryColor = '#0B0F17';
      newConfig.secondaryColor = '#5364F7';
      newConfig.accentColor = '#38BDF8';
    } else if (promptLower.includes('minimal') || promptLower.includes('clean') || promptLower.includes('white')) {
      newConfig.style = 'minimal';
      newConfig.primaryColor = '#FFFFFF';
      newConfig.secondaryColor = '#0F172A';
      newConfig.accentColor = '#64748B';
    } else if (promptLower.includes('vibrant') || promptLower.includes('colorful') || promptLower.includes('pink')) {
      newConfig.style = 'vibrant';
      newConfig.primaryColor = '#EC4899';
      newConfig.secondaryColor = '#8B5CF6';
      newConfig.accentColor = '#F472B6';
    }

    // 2. CONTENT & VOICE ADAPTATION
    if (promptLower.includes('bridal') || promptLower.includes('wedding')) {
      newConfig.heroHeadline = 'Exquisite Bridal & Special Event Artistry';
      newConfig.heroSubheadline = 'Transforming special moments into timeless beauty with high-end techniques.';
    } else if (promptLower.includes('hair') || promptLower.includes('stylist')) {
      newConfig.heroHeadline = 'Signature Luxury Hair Styling & Transformations';
      newConfig.heroSubheadline = 'Custom weaves, sleek cuts, and bespoke treatments for crown royalty.';
    } else if (promptLower.includes('boutique') || promptLower.includes('fashion')) {
      newConfig.heroHeadline = 'Curated Bespoke Fashion & Modern Apparel';
      newConfig.heroSubheadline = 'Discover hand-picked collections engineered for contemporary style.';
    }

    return newConfig;
  }

  /**
   * Generates default starter business themes based on business category.
   */
  static getDefaultCategoryTheme(category: BusinessCategory, businessName: string): AIThemeConfig {
    return {
      style: 'bram-light',
      primaryColor: '#FFFFFF',
      secondaryColor: '#0D5771',
      accentColor: '#3498E3',
      fontFamily: 'Outfit',
      heroHeadline: `Welcome to ${businessName || 'Your Business'}`,
      heroSubheadline: 'Professionally engineered digital presence powered by Cuzmify AI.',
      featuredServices: [
        {
          title: 'Signature Consultation',
          price: '$75',
          description: 'Personalized 1-on-1 assessment and customized beauty plan.',
        },
        {
          title: 'VIP Glam Package',
          price: '$250',
          description: 'Full luxury makeover including airbrushing, lashes, and hair touchups.',
        },
        {
          title: 'Masterclass Workshop',
          price: '$450',
          description: 'Hands-on intensive training for aspiring artists and professionals.',
        },
      ],
    };
  }
}
