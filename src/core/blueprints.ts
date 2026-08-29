import { AIThemeConfig, BusinessCategory, CuzmifyModuleType } from './types';

export interface CategoryBlueprint {
  id: string;
  category: BusinessCategory;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string;
  isFeatured: boolean;
  priceCents: number;
  developerName: string;
  themeConfig: AIThemeConfig;
  attachedModules: CuzmifyModuleType[];
}

export const CATEGORY_BLUEPRINTS: Record<string, CategoryBlueprint> = {
  beauty: {
    id: 'prod_beauty',
    category: 'Makeup Artist',
    name: 'BeautyPro Studio Suite',
    tagline: 'High-converting portfolio & instant WhatsApp booking',
    description: 'High-converting visual portfolio with instant WhatsApp booking, service menus, and Instagram feed integration.',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    priceCents: 0,
    developerName: 'Bram Intel Core',
    attachedModules: ['BOOKING', 'CATALOG', 'PAYMENTS'],
    themeConfig: {
      style: 'apple-luxury',
      primaryColor: '#0F172A',
      secondaryColor: '#F59E0B',
      accentColor: '#38BDF8',
      fontFamily: 'Outfit',
      heroHeadline: 'Exquisite Glamour & Bespoke Bridal Artistry',
      heroSubheadline: 'Elevating bridal elegance and special occasion glam with high-precision techniques and luxury products.',
      featuredServices: [
        {
          title: 'Signature Bridal Suite',
          price: '$350',
          description: 'Comprehensive trial, wedding day airbrush glam, touchup kit, and lash installation.',
        },
        {
          title: 'Red Carpet Event Glam',
          price: '$180',
          description: 'Full-face camera-ready makeup with custom contouring, premium lashes, and setting seal.',
        },
        {
          title: 'Private Masterclass Session',
          price: '$400',
          description: '1-on-1 hands-on intensive training covering shade matching, blending, and longevity.',
        },
      ],
    },
  },

  fashion: {
    id: 'prod_fashion',
    category: 'Fashion Designer',
    name: 'Vogue Boutique & Catalog',
    tagline: 'Modular apparel catalog with direct WhatsApp checkout',
    description: 'Modular catalog for fashion sellers with attachable cart, automated size selection, and direct WhatsApp checkout.',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    priceCents: 2900,
    developerName: 'Cuzmify Devs',
    attachedModules: ['CATALOG', 'CART', 'PAYMENTS', 'DELIVERY'],
    themeConfig: {
      style: 'bram-light',
      primaryColor: '#FFFFFF',
      secondaryColor: '#0D5771',
      accentColor: '#3498E3',
      fontFamily: 'Outfit',
      heroHeadline: 'Curated Bespoke Apparel & Modern Collections',
      heroSubheadline: 'Explore hand-picked luxury garments engineered for contemporary style and instant delivery.',
      featuredServices: [
        {
          title: 'Silk Evening Gown',
          price: '$280',
          description: '100% Mulberry silk bias-cut gown with hand-finished seams and custom sizing.',
        },
        {
          title: 'Tailored Velvet Blazer',
          price: '$195',
          description: 'Structured double-breasted velvet blazer featuring peak lapels and satin lining.',
        },
        {
          title: 'Bespoke Personal Styling',
          price: '$120',
          description: 'Virtual or in-person consultation with curated wardrobe recommendations.',
        },
      ],
    },
  },

  events: {
    id: 'prod_events',
    category: 'Event Planner',
    name: 'Couture Events & Planning',
    tagline: 'Dark gold theme with interactive package calculator',
    description: 'Elegant dark-gold theme with interactive event package calculator, client testimonials, and deposit payment gateway.',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
    isFeatured: false,
    priceCents: 4900,
    developerName: 'Apex Templates',
    attachedModules: ['BOOKING', 'CRM', 'PAYMENTS'],
    themeConfig: {
      style: 'dark-obsidian',
      primaryColor: '#071A24',
      secondaryColor: '#38BDF8',
      accentColor: '#F59E0B',
      fontFamily: 'Space Grotesk',
      heroHeadline: 'Unforgettable Celebrations & Bespoke Production',
      heroSubheadline: 'End-to-end luxury event design, venue transformations, floral production, and guest management.',
      featuredServices: [
        {
          title: 'Full Luxury Wedding Production',
          price: '$2,500',
          description: 'Complete concept development, vendor management, timeline execution, and 3D floor plan layout.',
        },
        {
          title: 'Corporate Gala Design',
          price: '$1,800',
          description: 'High-impact corporate staging, audiovisual orchestration, branding, and VIP hospitality.',
        },
        {
          title: 'Intimate VIP Soirée',
          price: '$950',
          description: 'Bespoke dinner party setup, table styling, custom menus, and ambient floral arrangements.',
        },
      ],
    },
  },

  photography: {
    id: 'prod_photo',
    category: 'Photographer',
    name: 'Luxe Lens Photography',
    tagline: 'Full-bleed gallery grid with high-speed asset loading',
    description: 'Full-bleed gallery grid with high-speed asset loading, client portal proofing, and session reservation engine.',
    imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=80',
    isFeatured: false,
    priceCents: 3500,
    developerName: 'Visionary Lab',
    attachedModules: ['BOOKING', 'CATALOG', 'ANALYTICS'],
    themeConfig: {
      style: 'minimal',
      primaryColor: '#FFFFFF',
      secondaryColor: '#0F172A',
      accentColor: '#64748B',
      fontFamily: 'Inter',
      heroHeadline: 'Cinematic Visual Storytelling & Portraiture',
      heroSubheadline: 'Capturing authentic emotions and timeless moments with high-resolution imagery and client proofing.',
      featuredServices: [
        {
          title: 'Editorial Portrait Experience',
          price: '$450',
          description: '2-hour studio or location session, 3 outfit changes, and 15 retouched digital assets.',
        },
        {
          title: 'Commercial Brand Campaign',
          price: '$1,200',
          description: 'Full-day commercial shoot including creative direction, model sourcing, and full commercial usage rights.',
        },
        {
          title: 'Wedding Storytelling Collection',
          price: '$2,800',
          description: '8-hour wedding coverage, second shooter, online gallery, engagement session, and print credit.',
        },
      ],
    },
  },

  jewelry: {
    id: 'prod_jewelry',
    category: 'Jewelry & Accessories',
    name: 'Opulent Atelier Jewelry',
    tagline: 'Handcrafted fine jewelry with gold & gemstone focus',
    description: 'Handcrafted fine jewelry showcase with high-res zoom cards, certificate verification, and custom commission requests.',
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    priceCents: 3900,
    developerName: 'Atelier Core',
    attachedModules: ['CATALOG', 'CART', 'PAYMENTS'],
    themeConfig: {
      style: 'luxury',
      primaryColor: '#1C1917',
      secondaryColor: '#F59E0B',
      accentColor: '#FEF3C7',
      fontFamily: 'Outfit',
      heroHeadline: 'Handcrafted Fine Jewelry & Bespoke Treasures',
      heroSubheadline: 'Timeless heirlooms crafted with ethically sourced gemstones and 18K solid gold.',
      featuredServices: [
        {
          title: 'Solitaire Diamond Ring',
          price: '$1,450',
          description: '1.2 carat lab-grown VVS1 diamond set in an 18K yellow gold band with GIA certification.',
        },
        {
          title: 'Hand-Carved Gold Pendant',
          price: '$680',
          description: 'Solid 14K gold pendant suspended on an adjustable 18-inch wheat chain.',
        },
        {
          title: 'Custom Commission Design',
          price: '$2,000',
          description: 'Collaborate with our master jeweler to sketch, CAD-render, and cast a one-of-a-kind piece.',
        },
      ],
    },
  },

  music: {
    id: 'prod_music',
    category: 'Music & Audio Studio',
    name: 'SoundStage & Beat Studio',
    tagline: 'Audio portfolio, beat store & studio session booking',
    description: 'Dark obsidian aesthetic engineered for music producers, recording studios, sound engineers, and DJs with track licensing and instant WhatsApp booking.',
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
    isFeatured: true,
    priceCents: 0,
    developerName: 'Cuzmify Audio Core',
    attachedModules: ['BOOKING', 'CATALOG', 'PAYMENTS'],
    themeConfig: {
      style: 'dark-obsidian',
      primaryColor: '#090D16',
      secondaryColor: '#38BDF8',
      accentColor: '#A855F7',
      fontFamily: 'Outfit',
      heroHeadline: 'World-Class Music Production & Sound Architecture',
      heroSubheadline: 'Grammy-grade mixing, custom beat production, vocal tracking, and audio mastering studio.',
      featuredServices: [
        {
          title: 'Full Studio Recording Session (4 Hours)',
          price: '$250',
          description: 'High-end vocal chain recording with Neumann U87, Apollo interfaces, and live autotune tracking.',
        },
        {
          title: 'Custom Beat Production & Stems',
          price: '$350',
          description: 'Exclusive custom instrumental with unlimited tracking rights, MIDI files, and full WAV stems.',
        },
        {
          title: 'Analog Mixing & Mastering',
          price: '$180',
          description: 'Hybrid analog/digital stem mixing with dynamic mastering optimized for Spotify & Apple Music.',
        },
      ],
    },
  },
};

/**
 * Gets the Category Blueprint matching a category or template name.
 */
export function getBlueprintByNameOrCategory(nameOrCategory: string): CategoryBlueprint {
  const query = nameOrCategory.toLowerCase();

  if (query.includes('music') || query.includes('sound') || query.includes('audio') || query.includes('beat') || query.includes('dj') || query.includes('producer') || query.includes('track') || query.includes('record')) {
    return CATEGORY_BLUEPRINTS.music;
  }
  if (query.includes('fashion') || query.includes('vogue') || query.includes('boutique')) {
    return CATEGORY_BLUEPRINTS.fashion;
  }
  if (query.includes('event') || query.includes('couture') || query.includes('planner')) {
    return CATEGORY_BLUEPRINTS.events;
  }
  if (query.includes('photo') || query.includes('lens') || query.includes('media')) {
    return CATEGORY_BLUEPRINTS.photography;
  }
  if (query.includes('jewelry') || query.includes('opulent') || query.includes('atelier')) {
    return CATEGORY_BLUEPRINTS.jewelry;
  }
  
  return CATEGORY_BLUEPRINTS.beauty;
}
