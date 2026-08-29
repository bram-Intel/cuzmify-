export type BusinessCategory =
  | 'Makeup Artist'
  | 'Hairstylist'
  | 'Event Planner'
  | 'Photographer'
  | 'Fashion Designer'
  | 'Boutique Seller'
  | 'Jewelry & Accessories'
  | 'Music & Audio Studio'
  | 'Caterer & Chef'
  | 'Consultant & Coach'
  | 'General Business';

export type CuzmifyModuleType =
  | 'CATALOG'
  | 'CART'
  | 'ORDERS'
  | 'PAYMENTS'
  | 'DELIVERY'
  | 'BOOKING'
  | 'CRM'
  | 'ANALYTICS';

export interface ModuleDefinition {
  type: CuzmifyModuleType;
  name: string;
  description: string;
  iconName: string;
  requires?: CuzmifyModuleType[];
  category: 'COMMERCE' | 'ENGAGEMENT' | 'OPERATIONS';
}

export interface WebsiteImportResult {
  url: string;
  businessName: string;
  tagline: string;
  services: { title: string; price?: string; description: string }[];
  contactInfo: { phone?: string; whatsapp?: string; location?: string; instagram?: string };
  report: {
    mobileScore: number;
    performanceScore: number;
    visualDesignScore: number;
    seoScore: number;
    issues: string[];
    recommendation: string;
  };
}

export interface AIThemeConfig {
  style: 'luxury' | 'modern' | 'minimal' | 'vibrant' | 'dark-elegance' | 'apple-luxury' | 'google-material' | 'bram-light' | 'dark-obsidian';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  heroHeadline: string;
  heroSubheadline: string;
  businessName?: string;
  featuredServices: { title: string; price: string; description: string }[];
}

export type CuzmifyComponentTraits = Record<string, string | number | boolean | undefined>;

