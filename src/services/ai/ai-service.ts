import { AIThemeConfig, BusinessCategory } from '@/core/types';

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

    if (promptLower.includes('luxury') || promptLower.includes('premium') || promptLower.includes('gold')) {
      newConfig.style = 'luxury';
      newConfig.primaryColor = '#1C1917'; // Rich obsidian
      newConfig.secondaryColor = '#F59E0B'; // Gold accent
      newConfig.accentColor = '#FEF3C7';
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

    if (promptLower.includes('bridal') || promptLower.includes('wedding')) {
      newConfig.heroHeadline = 'Exquisite Bridal & Special Event Artistry';
      newConfig.heroSubheadline = 'Transforming moments into timeless beauty with high-end techniques.';
    } else if (promptLower.includes('hair') || promptLower.includes('stylist')) {
      newConfig.heroHeadline = 'Signature Luxury Hair Styling & Transformations';
      newConfig.heroSubheadline = 'Custom weaves, sleek cuts, and bespoke treatments for crown royalty.';
    }

    return newConfig;
  }

  /**
   * Generates default starter business themes based on business category.
   */
  static getDefaultCategoryTheme(category: BusinessCategory, businessName: string): AIThemeConfig {
    return {
      style: 'luxury',
      primaryColor: '#0B0F17',
      secondaryColor: '#F59E0B',
      accentColor: '#5364F7',
      fontFamily: 'Inter',
      heroHeadline: `Welcome to ${businessName || 'Your Business'}`,
      heroSubheadline: 'Professionally engineered digital presence powered by Cuzmify.',
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
