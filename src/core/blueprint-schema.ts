/**
 * CUZMIFY BUSINESS BLUEPRINT & MODULE PROTOCOL SCHEMA
 * Standardized data contracts for headless business engines, templates & AI binding.
 */

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'NGN' | 'CAD' | 'AUD' | 'AED' | 'KES' | 'ZAR';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', label: 'USD ($)' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  NGN: { code: 'NGN', symbol: '₦', label: 'NGN (₦)' },
  CAD: { code: 'CAD', symbol: 'CA$', label: 'CAD ($)' },
  AUD: { code: 'AUD', symbol: 'A$', label: 'AUD ($)' },
  AED: { code: 'AED', symbol: 'AED', label: 'AED (د.إ)' },
  KES: { code: 'KES', symbol: 'KSh', label: 'KES (KSh)' },
  ZAR: { code: 'ZAR', symbol: 'R', label: 'ZAR (R)' },
};

// ── 1. Business Profile & Identity ──────────────────────────────────────────
export interface BusinessProfile {
  name: string;
  tagline: string;
  category: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  country: string;
  currency: CurrencyCode;
  logoUrl?: string;
  instagramHandle?: string;
}

// ── 2. Services Catalog Module ──────────────────────────────────────────────
export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMinutes?: number;
  locationType: 'in_studio' | 'on_location' | 'virtual' | 'flexible';
  description: string;
  tag?: string; // 'VIP' | 'SIGNATURE' | 'POPULAR' | 'BRIDAL'
  category?: string;
  depositRequired?: boolean;
  depositAmount?: number;
  imageUrl?: string;
  enabled: boolean;
}

export interface ServiceCatalogModuleConfig {
  enabled: boolean;
  currency: CurrencyCode;
  items: ServiceItem[];
}

// ── 3. Products Catalog Module (Physical / Digital Goods) ───────────────────
export interface ProductItem {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  inStock: boolean;
  inventoryCount?: number;
  weightGrams?: number;
  category?: string;
  description: string;
  imageUrl?: string;
  variants?: Array<{ name: string; options: string[] }>;
  enabled: boolean;
}

export interface ProductCatalogModuleConfig {
  enabled: boolean;
  currency: CurrencyCode;
  items: ProductItem[];
}

// ── 4. WhatsApp Booking & Commerce Engine ───────────────────────────────────
export interface WhatsAppModuleConfig {
  enabled: boolean;
  phoneNumber: string; // international format without plus e.g. "18005554526"
  defaultBookingTemplate: string;
  defaultProductOrderTemplate: string;
  generalInquiryTemplate: string;
  floatingWidgetEnabled: boolean;
  floatingWidgetPosition: 'bottom-right' | 'bottom-left';
  floatingWidgetGreeting: string;
}

// ── 5. Shopping Cart Module ─────────────────────────────────────────────────
export interface CartModuleConfig {
  enabled: boolean;
  currency: CurrencyCode;
  checkoutMode: 'whatsapp' | 'online_payment' | 'both';
  minimumOrderValue?: number;
  freeShippingThreshold?: number;
  collectDeliveryAddress: boolean;
}

// ── 6. Online Payments Module ───────────────────────────────────────────────
export interface PaymentModuleConfig {
  enabled: boolean;
  provider: 'paystack' | 'stripe' | 'flutterwave';
  publicKey?: string;
  currency: CurrencyCode;
  testMode: boolean;
}

// ── 7. Appointment Booking Module ───────────────────────────────────────────
export interface BookingModuleConfig {
  enabled: boolean;
  mode: 'whatsapp' | 'calendar' | 'external_link';
  externalBookingUrl?: string;
  requireDeposit: boolean;
  defaultDepositAmount: number;
}

// ── 8. Media Vault Asset Library ────────────────────────────────────────────
export interface MediaVaultAsset {
  id: string;
  url: string;
  name: string;
  type: 'logo' | 'hero' | 'gallery' | 'service' | 'product' | 'general' | 'video' | 'testimonial';
  source: 'upload' | 'instagram' | 'unsplash' | 'template' | 'ai_generated';
  caption?: string;
  instagramPostUrl?: string;
  width?: number;
  height?: number;
  addedAt: string;
}

// ── 9. Master Business Blueprint ────────────────────────────────────────────
export interface BusinessBlueprint {
  version: '1.0';
  profile: BusinessProfile;
  modules: {
    whatsapp: WhatsAppModuleConfig;
    services: ServiceCatalogModuleConfig;
    products: ProductCatalogModuleConfig;
    cart: CartModuleConfig;
    payments: PaymentModuleConfig;
    booking: BookingModuleConfig;
  };
  mediaVault: MediaVaultAsset[];
  updatedAt: string;
}

// ── Standard Action Protocol Types (data-cuzmify-action) ─────────────────────
export type CuzmifyActionType =
  | 'whatsapp:booking'
  | 'whatsapp:order'
  | 'whatsapp:general'
  | 'cart:add'
  | 'cart:toggle'
  | 'payment:checkout'
  | 'booking:calendar'
  | 'custom:url';

export interface ActionBinding {
  action: CuzmifyActionType;
  targetId?: string; // serviceId or productId
  targetName?: string;
  targetPrice?: number;
  customMessage?: string;
  url?: string;
}

export interface BlueprintInitOptions {
  name?: string;
  tagline?: string;
  category?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  currency?: CurrencyCode;
  instagramHandle?: string;
  services?: ServiceItem[];
  products?: ProductItem[];
  mediaVault?: MediaVaultAsset[];
}

// ── Initial Default Blueprint Factory ───────────────────────────────────────
export function createDefaultBlueprint(optionsOrName?: string | BlueprintInitOptions, theme: string = 'bram-light'): BusinessBlueprint {
  const options: BlueprintInitOptions = typeof optionsOrName === 'string' ? { name: optionsOrName } : (optionsOrName || {});
  const businessName = options.name || 'Gmakeup Studio';
  const currency = options.currency || 'USD';
  const category = options.category || 'Makeup Artist';
  const whatsappNumber = options.whatsapp || '18005554526';
  const instagramHandle = options.instagramHandle || '';

  return {
    version: '1.0',
    profile: {
      name: businessName,
      tagline: options.tagline || 'World-class luxury beauty artistry and flawless styling.',
      category,
      phone: options.phone || '+1 (800) 555-GLAM',
      whatsapp: whatsappNumber,
      email: options.email || 'concierge@cuzmify.local',
      address: '742 Evergreen Terrace',
      city: 'Los Angeles, CA',
      country: 'United States',
      currency,
      instagramHandle,
    },
    modules: {
      whatsapp: {
        enabled: true,
        phoneNumber: whatsappNumber,
        defaultBookingTemplate: `Hello ${businessName}, I would like to inquire about booking the {serviceName} ({price}). My preferred date is [insert date].`,
        defaultProductOrderTemplate: `Hello ${businessName}, I would like to order {productName} ({price}). Please confirm availability!`,
        generalInquiryTemplate: `Hello ${businessName}, I have a general inquiry regarding your services.`,
        floatingWidgetEnabled: true,
        floatingWidgetPosition: 'bottom-right',
        floatingWidgetGreeting: 'Chat with our artistry team on WhatsApp',
      },
      services: {
        enabled: true,
        currency,
        items: options.services && options.services.length > 0 ? options.services : [
          {
            id: 'srv-bridal-suite',
            name: 'Royal Platinum Bridal Suite',
            price: currency === 'NGN' ? 380000 : 380,
            durationMinutes: 120,
            locationType: 'on_location',
            description: 'Complete bridal preview trial, 24hr HD airbrush makeup, couture hair design, and emergency touch-up kit.',
            tag: 'BRIDAL',
            category: 'Bridal',
            depositRequired: true,
            depositAmount: currency === 'NGN' ? 100000 : 100,
            imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
            enabled: true,
          },
          {
            id: 'srv-glam-session',
            name: 'Red Carpet & Evening Glam',
            price: currency === 'NGN' ? 190000 : 180,
            durationMinutes: 75,
            locationType: 'in_studio',
            description: 'Full luxury soft/cut-crease glam with premium mink lashes and precision 24hr airbrushing.',
            tag: 'SIGNATURE',
            category: 'Special Event',
            enabled: true,
          },
          {
            id: 'srv-destination-concierge',
            name: 'Destination VIP Concierge',
            price: currency === 'NGN' ? 1200000 : 1200,
            durationMinutes: 480,
            locationType: 'on_location',
            description: 'Full-day dedicated on-location artist for ceremony, reception restyling, and photoshoot glam.',
            tag: 'VIP',
            category: 'Bridal',
            enabled: true,
          },
          {
            id: 'srv-masterclass',
            name: '1-on-1 Pro Masterclass Session',
            price: currency === 'NGN' ? 260000 : 260,
            durationMinutes: 90,
            locationType: 'in_studio',
            description: 'Hands-on bespoke technique training covering skin diagnosis, lash mapping, and contouring.',
            tag: 'POPULAR',
            category: 'Education',
            enabled: true,
          },
        ],
      },
      products: {
        enabled: true,
        currency,
        items: options.products && options.products.length > 0 ? options.products : [
          {
            id: 'prd-silk-lashes',
            name: 'Haute Couture 3D Silk Lashes',
            price: currency === 'NGN' ? 28000 : 28,
            compareAtPrice: currency === 'NGN' ? 35000 : 35,
            inStock: true,
            inventoryCount: 45,
            category: 'Lashes',
            description: 'Reusable 25+ wears luxury handcrafted silk lashes for lightweight comfort.',
            imageUrl: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=800&auto=format&fit=crop&q=80',
            enabled: true,
          },
          {
            id: 'prd-glow-mist',
            name: '24hr Hydro-Glow Setting Mist',
            price: currency === 'NGN' ? 36000 : 36,
            inStock: true,
            inventoryCount: 20,
            category: 'Skincare',
            description: 'Ultra-fine hydrating spray with rosewater and hyaluronic acid for flawless all-day radiance.',
            imageUrl: 'https://images.unsplash.com/photo-1608248597359-0a6715f52233?w=800&auto=format&fit=crop&q=80',
            enabled: true,
          },
        ],
      },
      cart: {
        enabled: true,
        currency,
        checkoutMode: 'whatsapp',
        collectDeliveryAddress: true,
      },
      payments: {
        enabled: false,
        provider: 'paystack',
        currency,
        testMode: true,
      },
      booking: {
        enabled: true,
        mode: 'whatsapp',
        requireDeposit: false,
        defaultDepositAmount: currency === 'NGN' ? 50000 : 50,
      },
    },
    mediaVault: options.mediaVault && options.mediaVault.length > 0 ? options.mediaVault : [
      {
        id: 'mv-hero-1',
        url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
        name: 'Bridal Glam Hero Photo',
        type: 'hero',
        source: 'template',
        addedAt: new Date().toISOString(),
      },
      {
        id: 'mv-about-1',
        url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80',
        name: 'Artist in Action',
        type: 'gallery',
        source: 'template',
        addedAt: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}
