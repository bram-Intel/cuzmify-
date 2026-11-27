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
  bio?: string;
  category: string;
  nicheId?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  country: string;
  currency: CurrencyCode;
  logoUrl?: string;
  instagramHandle?: string;
  instagram?: string;
}

// ── 2. Services Catalog Module ──────────────────────────────────────────────
export type ServicePriceMode = 'fixed' | 'starting_at' | 'quote';

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  priceMode?: ServicePriceMode;
  durationMinutes?: number;
  locationType: 'in_studio' | 'on_location' | 'virtual' | 'flexible';
  description: string;
  tag?: string;
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
  igMediaId?: string;
  url: string;
  thumbnailUrl?: string;
  rawMediaUrl?: string;
  rawThumbUrl?: string;
  name: string;
  type: 'logo' | 'hero' | 'gallery' | 'service' | 'product' | 'general' | 'video' | 'testimonial';
  mediaKind?: 'image' | 'video';
  mimeType?: string;
  source: 'upload' | 'instagram' | 'unsplash' | 'template' | 'ai_generated';
  caption?: string;
  instagramPostUrl?: string;
  width?: number;
  height?: number;
  addedAt: string;
}

// ── 7b. Instagram Live Sync Module ─────────────────────────────────────────
export interface InstagramSyncModuleConfig {
  enabled: boolean;
  autoSyncFeed: boolean;
  lastSyncedAt: string;
  mediaCount: number;
}

// ── 7c. Instagram DM Booking Bot Module ───────────────────────────────────
export interface DmBookingBotModuleConfig {
  enabled: boolean;
  triggerKeyword: string;
  autoReplyMessage: string;
}

// ── 7d. WhatsApp Appointment Reminders Module ──────────────────────────────
export interface AppointmentRemindersModuleConfig {
  enabled: boolean;
  leadTimeHours: number;
  messageTemplate: string;
}

// ── 9. Template Engine Overrides & Rich Sections ──────────────────────────
export interface DeviceDesignOverrides {
  pagePaddingX?: 'compact' | 'normal' | 'spacious';
  sectionSpacing?: 'compact' | 'normal' | 'airy';
  heroLayout?: 'split' | 'centered' | 'full_bleed' | 'minimal_card';
  heroImageAspect?: 'auto' | 'square' | 'landscape' | 'portrait' | 'wide';
  heroImageMaxHeight?: number;
  heroImageShape?: 'arch' | 'rounded' | 'card' | 'circle';
  heroImageFit?: 'cover' | 'contain';
  heroTextAlign?: 'left' | 'center';
  galleryColumns?: number;
  servicesColumns?: number;
  fontScale?: 'compact' | 'normal' | 'large';
  hideHeroImage?: boolean;
}

export interface TemplateDesignOverrides extends DeviceDesignOverrides {
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  buttonRadius?: 'pill' | 'rounded' | 'sharp';
  fontMood?: 'editorial_serif' | 'modern_sans' | 'bold_display';
  servicesLayout?: 'editorial_list' | 'card_grid' | 'compact_menu';
  sectionOrder?: string[];
  submitButtonIcon?: 'auto' | 'whatsapp' | 'sparkles' | 'calendar' | 'none';
  submitButtonColor?: string;
  customCss?: string;
  responsive?: {
    mobile?: DeviceDesignOverrides;
    tablet?: DeviceDesignOverrides;
    desktop?: DeviceDesignOverrides;
  };
}

export interface BlueprintCustomSection {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  layout: 'cards' | 'checklist' | 'hours_info' | 'banner_cta' | 'custom_html';
  items?: Array<{ label: string; detail: string }>;
  ctaText?: string;
  ctaHref?: string;
  html?: string;
}

export const BLUEPRINT_INJECTION_SLOTS = [
  'top_bar',
  'nav_actions',
  'hero_above',
  'hero_cta_after',
  'hero_below',
  'services_above',
  'services_below',
  'booking_above',
  'submit_button_prefix',
  'submit_button_suffix',
  'booking_below',
  'footer',
] as const;

export type BlueprintSlotId = (typeof BLUEPRINT_INJECTION_SLOTS)[number];

export interface BlueprintSeoConfig {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
  schemaType?: 'LocalBusiness' | 'BeautySalon' | 'PhotographyBusiness' | 'EventVenue' | 'Bakery' | 'ProfessionalService';
  priceRange?: string;
  openingHours?: string;
  areaServed?: string;
}

export interface BlueprintTestimonialItem {
  id: string;
  clientName: string;
  quote: string;
  roleOrEvent?: string;
}

export interface BlueprintFaqItem {
  id: string;
  question: string;
  answer: string;
}

// ── 10. Master Business Blueprint ───────────────────────────────────────────
export interface BusinessBlueprint {
  version: '1.0';
  templateId?: string;
  nicheId?: string;
  profile: BusinessProfile;
  modules: {
    whatsapp: WhatsAppModuleConfig;
    services: ServiceCatalogModuleConfig;
    products: ProductCatalogModuleConfig;
    cart: CartModuleConfig;
    payments: PaymentModuleConfig;
    booking: BookingModuleConfig;
    instagramSync?: InstagramSyncModuleConfig;
    dmBookingBot?: DmBookingBotModuleConfig;
    appointmentReminders?: AppointmentRemindersModuleConfig;
  };
  mediaVault: MediaVaultAsset[];
  customCopy?: Record<string, string>;
  sectionVisibility?: Record<string, boolean>;
  designOverrides?: TemplateDesignOverrides;
  templateDesignOverrides?: Record<string, TemplateDesignOverrides>;
  customSections?: BlueprintCustomSection[];
  injections?: Partial<Record<BlueprintSlotId, string>>;
  seo?: BlueprintSeoConfig;
  testimonials?: BlueprintTestimonialItem[];
  faqs?: BlueprintFaqItem[];
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
  bio?: string;
  category?: string;
  nicheId?: string;
  templateId?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  country?: string;
  currency?: CurrencyCode;
  instagramHandle?: string;
  services?: ServiceItem[];
  products?: ProductItem[];
  mediaVault?: MediaVaultAsset[];
}

// ── Initial Default Blueprint Factory (Zero Invented Business Facts) ─────────
export function createDefaultBlueprint(optionsOrName?: string | BlueprintInitOptions, _theme: string = 'bram-light'): BusinessBlueprint {
  const options: BlueprintInitOptions = typeof optionsOrName === 'string' ? { name: optionsOrName } : (optionsOrName || {});
  const businessName = options.name?.trim() || 'My Studio';
  const currency = options.currency || 'NGN';
  const category = options.category || 'Service Business';
  const whatsappNumber = (options.whatsapp || '').replace(/[^\d]/g, '');
  const instagramHandle = (options.instagramHandle || '').replace(/^@/, '');

  return {
    version: '1.0',
    nicheId: options.nicheId || 'beauty_makeup',
    templateId: options.templateId || 'editorial-atelier',
    profile: {
      name: businessName,
      tagline: options.tagline || '',
      bio: options.bio || '',
      category,
      nicheId: options.nicheId || 'beauty_makeup',
      phone: options.phone || '',
      whatsapp: whatsappNumber,
      email: options.email || '',
      address: '',
      city: options.city || '',
      country: options.country || '',
      currency,
      instagramHandle,
      instagram: instagramHandle,
    },
    modules: {
      whatsapp: {
        enabled: true,
        phoneNumber: whatsappNumber,
        defaultBookingTemplate: `Hello ${businessName}, I would like to enquire about {serviceName} ({price}).`,
        defaultProductOrderTemplate: `Hello ${businessName}, I would like to enquire about {productName} ({price}).`,
        generalInquiryTemplate: `Hello ${businessName}, I found your website and would love to make an enquiry.`,
        floatingWidgetEnabled: true,
        floatingWidgetPosition: 'bottom-right',
        floatingWidgetGreeting: `Chat with ${businessName} on WhatsApp`,
      },
      services: {
        enabled: true,
        currency,
        items: options.services ? [...options.services] : [],
      },
      products: {
        enabled: false,
        currency,
        items: options.products ? [...options.products] : [],
      },
      cart: {
        enabled: false,
        currency,
        checkoutMode: 'whatsapp',
        collectDeliveryAddress: false,
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
        defaultDepositAmount: 0,
      },
      instagramSync: {
        enabled: Boolean(instagramHandle),
        autoSyncFeed: true,
        lastSyncedAt: new Date().toISOString(),
        mediaCount: options.mediaVault?.length || 0,
      },
      dmBookingBot: {
        enabled: false,
        triggerKeyword: 'book',
        autoReplyMessage: '',
      },
      appointmentReminders: {
        enabled: false,
        leadTimeHours: 24,
        messageTemplate: '',
      },
    },
    mediaVault: options.mediaVault ? [...options.mediaVault] : [],
    customCopy: {},
    sectionVisibility: {
      about: true,
      services: true,
      portfolio: true,
      enquiry: true,
    },
    updatedAt: new Date().toISOString(),
  };
}
