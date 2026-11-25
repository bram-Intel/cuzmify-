import { SchemaType, type FunctionDeclaration } from '@google/generative-ai';
import {
  SUPPORTED_CURRENCIES,
  type BusinessBlueprint,
  type CurrencyCode,
  type ServicePriceMode,
  type TemplateDesignOverrides,
} from '@/core/blueprint-schema';
import { resolveNicheBlueprint } from '@/core/niche-blueprints';
import { resolveTemplateEngineId, TEMPLATE_ENGINES } from '@/core/template-engines';
import { FREE_PLAN_SERVICE_LIMIT } from '@/lib/billing-constants';

export interface McpToolProperty {
  type: 'string' | 'number' | 'boolean';
  description: string;
  enum?: string[];
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, McpToolProperty>;
    required?: string[];
  };
}

export const CUZMIFY_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'get_site_blueprint',
    description:
      'Inspect the complete live site state: active template engine & visual styles, section visibility, custom copy slots, business profile, services, products, media assets, testimonials, FAQs, WhatsApp, and publish status.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID when calling external MCP endpoint.' },
      },
    },
  },
  {
    name: 'update_business_profile',
    description:
      'Update business profile identity or main hero copy (name, headline, bio, city, country, currency, email, instagramHandle) without inventing unrequested prices.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        name: { type: 'string', description: 'Business / studio name.' },
        headline: { type: 'string', description: 'Main Hero headline shown at the top of the website.' },
        bio: { type: 'string', description: 'About / Hero subheadline description.' },
        city: { type: 'string', description: 'City or service area (e.g. Lagos, Abuja, London).' },
        country: { type: 'string', description: 'Country name.' },
        currency: {
          type: 'string',
          description: '3-letter currency code.',
          enum: ['NGN', 'USD', 'GBP', 'EUR', 'KES', 'ZAR', 'CAD', 'AED'],
        },
        email: { type: 'string', description: 'Public business contact email.' },
        instagramHandle: { type: 'string', description: 'Instagram username without @.' },
      },
    },
  },
  {
    name: 'customize_template_copy',
    description:
      'Edit any section heading, eyebrow label, badge, or CTA button copy directly inside the active template engine.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        heroBadge: { type: 'string', description: 'Small uppercase eyebrow badge above the Hero headline.' },
        primaryCta: { type: 'string', description: 'Main booking/navbar CTA button label (e.g. Reserve Your Date).' },
        servicesEyebrow: { type: 'string', description: 'Eyebrow text above the Services heading.' },
        servicesHeading: { type: 'string', description: 'Services section main heading.' },
        serviceItemCta: { type: 'string', description: 'Action button text inside each service row/card.' },
        portfolioEyebrow: { type: 'string', description: 'Eyebrow text above the Portfolio/Gallery heading.' },
        portfolioHeading: { type: 'string', description: 'Portfolio/Gallery section main heading.' },
        enquiryEyebrow: { type: 'string', description: 'Eyebrow label above booking/enquiry heading.' },
        enquiryHeading: { type: 'string', description: 'Booking/Enquiry section heading.' },
        enquirySubheading: { type: 'string', description: 'Short instruction right below the booking heading.' },
        testimonialsHeading: { type: 'string', description: 'Heading for client testimonials section.' },
        faqHeading: { type: 'string', description: 'Heading for FAQ section.' },
      },
    },
  },
  {
    name: 'customize_template_design',
    description:
      'Customize brand palette colors (hex), card/background surfaces, button corner radius, font mood, mobile/page horizontal padding, section spacing, hero image aspect ratio/max height/shape/fit, or gallery column count on top of the active template engine.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        accentColor: { type: 'string', description: 'Hex brand accent color (e.g. #D97706, #0D5771, #E11D48).' },
        backgroundColor: { type: 'string', description: 'Hex page background color (e.g. #FAF7F2, #09090B).' },
        surfaceColor: { type: 'string', description: 'Hex card/panel surface color (e.g. #FFFFFF, #18181B).' },
        textColor: { type: 'string', description: 'Hex primary text color (e.g. #1C1917, #FAFAFA).' },
        buttonRadius: {
          type: 'string',
          description: 'Corner style for buttons and CTAs.',
          enum: ['pill', 'rounded', 'sharp'],
        },
        fontMood: {
          type: 'string',
          description: 'Typography pairing mood.',
          enum: ['editorial_serif', 'modern_sans', 'bold_display'],
        },
        pagePaddingX: {
          type: 'string',
          description: 'Horizontal page margin/padding preset across mobile and desktop.',
          enum: ['compact', 'normal', 'spacious'],
        },
        sectionSpacing: {
          type: 'string',
          description: 'Vertical padding rhythm between website sections.',
          enum: ['compact', 'normal', 'airy'],
        },
        heroImageAspect: {
          type: 'string',
          description: 'Hero image frame aspect ratio.',
          enum: ['auto', 'square', 'landscape', 'portrait', 'wide'],
        },
        heroImageMaxHeight: {
          type: 'number',
          description: 'Maximum height in pixels for the Hero image frame (180 to 680).',
        },
        heroImageShape: {
          type: 'string',
          description: 'Corner silhouette for the Hero image card.',
          enum: ['arch', 'rounded', 'card', 'circle'],
        },
        heroImageFit: {
          type: 'string',
          description: 'Image fitting inside the Hero frame ("contain" fits logos/icons cleanly without cropping).',
          enum: ['cover', 'contain'],
        },
        galleryColumns: {
          type: 'number',
          description: 'Portfolio gallery grid columns (1 to 4).',
        },
        resetToDefaults: {
          type: 'boolean',
          description: 'Set true to clear custom colors/fonts/layout overrides and restore native template defaults.',
        },
      },
    },
  },
  {
    name: 'toggle_section_visibility',
    description: 'Show or hide any section cleanly inside the active template engine (hero, services, portfolio, testimonials, faq, booking).',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        section: {
          type: 'string',
          description: 'Target section ID.',
          enum: ['hero', 'services', 'portfolio', 'testimonials', 'faq', 'booking'],
        },
        visible: { type: 'boolean', description: 'True to display section, false to hide it.' },
      },
      required: ['section', 'visible'],
    },
  },
  {
    name: 'upsert_service_package',
    description:
      'Add a new service package or update an existing service by name/id. Use priceMode "quote" with price 0 if the vendor has not stated a price.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        id: { type: 'string', description: 'Existing service ID to update (optional).' },
        name: { type: 'string', description: 'Service or package title (e.g. Bridal Glam Package).' },
        price: { type: 'number', description: 'Numeric price in the business currency (0 for quote).' },
        priceMode: {
          type: 'string',
          description: 'Pricing display style.',
          enum: ['fixed', 'starting_at', 'quote'],
        },
        description: { type: 'string', description: 'What is included in this package.' },
        durationMinutes: { type: 'number', description: 'Estimated duration in minutes.' },
        tag: { type: 'string', description: 'Short badge label like SIGNATURE, BRIDAL, VIP, POPULAR.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_service_package',
    description: 'Delete a service package from the website catalog by exact ID or service name.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        id: { type: 'string', description: 'Service ID to delete.' },
        name: { type: 'string', description: 'Service name to match if ID is not known.' },
      },
    },
  },
  {
    name: 'upsert_product_item',
    description: 'Add or update a physical or digital product in the vendor product catalog.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        id: { type: 'string', description: 'Existing product ID (optional).' },
        name: { type: 'string', description: 'Product name.' },
        price: { type: 'number', description: 'Product price in business currency.' },
        description: { type: 'string', description: 'Short product description.' },
        inStock: { type: 'boolean', description: 'Whether product is currently available.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_product_item',
    description: 'Remove a product from the catalog by ID or name.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        id: { type: 'string', description: 'Product ID.' },
        name: { type: 'string', description: 'Product name.' },
      },
    },
  },
  {
    name: 'upsert_testimonial',
    description: 'Add, update, or remove a real client testimonial provided by the vendor.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        id: { type: 'string', description: 'Testimonial ID (optional).' },
        clientName: { type: 'string', description: 'Client name (must come from vendor, never invented).' },
        quote: { type: 'string', description: 'Exact client testimonial quote.' },
        roleOrEvent: { type: 'string', description: 'Optional event/context like Bridal Client.' },
        remove: { type: 'boolean', description: 'Set true to remove matching testimonial by id or clientName.' },
      },
      required: ['clientName'],
    },
  },
  {
    name: 'upsert_faq',
    description: 'Add, update, or remove a Frequently Asked Question item.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        id: { type: 'string', description: 'FAQ ID (optional).' },
        question: { type: 'string', description: 'Customer question.' },
        answer: { type: 'string', description: 'Clear vendor answer.' },
        remove: { type: 'boolean', description: 'Set true to remove matching FAQ.' },
      },
      required: ['question'],
    },
  },
  {
    name: 'switch_template_style',
    description:
      'Losslessly switch the website visual template engine ONLY when the user requests changing design style/layout between editorial-atelier, noir-showcase, or modern-studio.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        templateId: {
          type: 'string',
          description: 'Target template engine ID.',
          enum: ['editorial-atelier', 'noir-showcase', 'modern-studio'],
        },
      },
      required: ['templateId'],
    },
  },
  {
    name: 'switch_niche_blueprint',
    description:
      'Switch the service vendor industry niche (adapts section headings, booking CTA, and enquiry form prompts).',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        nicheId: {
          type: 'string',
          description: 'Target vendor niche.',
          enum: [
            'beauty_makeup',
            'photography_media',
            'events_planning',
            'catering_cakes',
            'design_fashion',
            'general_services',
          ],
        },
      },
      required: ['nicheId'],
    },
  },
  {
    name: 'configure_whatsapp',
    description: 'Update the vendor WhatsApp booking phone number, enquiry message template, or floating widget settings.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        phoneNumber: { type: 'string', description: 'WhatsApp number with country code digits (e.g. 2348031234567).' },
        bookingTemplate: { type: 'string', description: 'Optional custom pre-filled WhatsApp enquiry template.' },
        floatingWidgetEnabled: { type: 'boolean', description: 'Toggle floating WhatsApp chat pill.' },
        floatingWidgetGreeting: { type: 'string', description: 'Greeting label shown for floating WhatsApp button.' },
      },
    },
  },
  {
    name: 'promote_media_to_hero',
    description: 'Set a specific photo in the Media Vault as the main Hero cover image (by 1-based photo number or name).',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        assetId: { type: 'string', description: 'Media asset ID.' },
        photoNumber: { type: 'number', description: '1-based index of the photo in the Media Vault.' },
        query: { type: 'string', description: 'Keyword to match asset name/caption.' },
      },
    },
  },
  {
    name: 'list_enquiries',
    description: 'List recent client booking enquiries submitted on the live website for this account.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        limit: { type: 'number', description: 'Maximum leads to return (default 10).' },
      },
    },
  },
  {
    name: 'publish_site',
    description: 'Publish the current website live to its public link so clients can view and submit bookings.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
      },
    },
  },
];

/** Converts MCP JSON schemas into Gemini SDK FunctionDeclaration format. */
export function toGeminiFunctionDeclarations(includeServerOnly = true): FunctionDeclaration[] {
  const excluded = includeServerOnly ? new Set<string>() : new Set(['list_enquiries', 'publish_site']);
  return CUZMIFY_MCP_TOOLS.filter((t) => !excluded.has(t.name)).map((tool) => {
    const props: Record<string, any> = {};
    for (const [k, v] of Object.entries(tool.inputSchema.properties)) {
      if (k === 'siteId') continue; // Studio/account context supplies active site automatically
      const schemaType =
        v.type === 'number'
          ? SchemaType.NUMBER
          : v.type === 'boolean'
            ? SchemaType.BOOLEAN
            : SchemaType.STRING;
      props[k] = {
        type: schemaType,
        description: v.description,
        ...(v.enum ? { enum: v.enum } : {}),
      };
    }
    const filteredReq = (tool.inputSchema.required || []).filter((r) => r !== 'siteId');
    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: props,
        ...(filteredReq.length > 0 ? { required: filteredReq } : {}),
      },
    };
  });
}

export interface BlueprintToolExecutionResult {
  ok: boolean;
  blueprint: BusinessBlueprint;
  changeSummary: string;
  data?: Record<string, unknown>;
  error?: string;
}

function normalizeSafeHex(val?: unknown): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed.toUpperCase();
  return undefined;
}

/**
 * Pure deterministic executor for blueprint-level MCP tools.
 * Used identically by both `/api/ai/chat` (in-app Copilot) and `/api/mcp` (external MCP clients).
 */
export function executeBlueprintMcpTool(
  toolName: string,
  args: Record<string, any>,
  inputBlueprint: BusinessBlueprint,
  options?: { plan?: 'free' | 'pro'; siteMeta?: { id?: string; subdomain?: string | null; status?: string; customDomain?: string | null } }
): BlueprintToolExecutionResult {
  const bp: BusinessBlueprint = JSON.parse(JSON.stringify(inputBlueprint));
  const plan = options?.plan === 'pro' ? 'pro' : 'free';

  switch (toolName) {
    case 'get_site_blueprint': {
      const tplId = resolveTemplateEngineId(bp.templateId);
      const tplMeta = TEMPLATE_ENGINES[tplId];
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Inspected ${tplMeta.name} blueprint`,
        data: {
          name: bp.profile.name,
          headline: bp.customCopy?.headline || bp.profile.tagline,
          bio: bp.customCopy?.subheadline || bp.profile.bio,
          nicheId: bp.nicheId,
          templateId: tplId,
          templateName: tplMeta.name,
          templateTagline: tplMeta.tagline,
          currency: bp.profile.currency,
          city: bp.profile.city,
          country: bp.profile.country,
          instagramHandle: bp.profile.instagramHandle || '',
          whatsapp: bp.modules.whatsapp.phoneNumber,
          customCopy: bp.customCopy || {},
          designOverrides: bp.designOverrides || {},
          sectionVisibility: bp.sectionVisibility || {},
          servicesCount: bp.modules.services.items.length,
          services: bp.modules.services.items.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            priceMode: s.priceMode,
          })),
          productsCount: bp.modules.products?.items?.length || 0,
          testimonialsCount: bp.testimonials?.length || 0,
          faqsCount: bp.faqs?.length || 0,
          mediaCount: bp.mediaVault.length,
          mediaItems: bp.mediaVault.slice(0, 12).map((m, idx) => ({
            photoNumber: idx + 1,
            id: m.id,
            name: m.name,
            type: m.type,
          })),
          status: options?.siteMeta?.status || 'draft',
          subdomain: options?.siteMeta?.subdomain || null,
          customDomain: options?.siteMeta?.customDomain || null,
        },
      };
    }

    case 'update_business_profile': {
      const updated: string[] = [];
      if (typeof args.name === 'string' && args.name.trim()) {
        bp.profile.name = args.name.trim().slice(0, 80);
        updated.push(`name="${bp.profile.name}"`);
      }
      if (typeof args.headline === 'string' && args.headline.trim()) {
        bp.profile.tagline = args.headline.trim().slice(0, 140);
        bp.customCopy = { ...(bp.customCopy || {}), headline: bp.profile.tagline };
        updated.push('headline');
      }
      if (typeof args.bio === 'string' && args.bio.trim()) {
        bp.profile.bio = args.bio.trim().slice(0, 400);
        bp.customCopy = { ...(bp.customCopy || {}), subheadline: bp.profile.bio };
        updated.push('bio');
      }
      if (typeof args.city === 'string') {
        bp.profile.city = args.city.trim().slice(0, 60);
        updated.push(`city="${bp.profile.city}"`);
      }
      if (typeof args.country === 'string') {
        bp.profile.country = args.country.trim().slice(0, 60);
        updated.push('country');
      }
      if (typeof args.email === 'string' && args.email.includes('@')) {
        bp.profile.email = args.email.trim();
        updated.push('email');
      }
      if (typeof args.instagramHandle === 'string' && args.instagramHandle.trim()) {
        bp.profile.instagramHandle = args.instagramHandle.trim().replace(/^@/, '').slice(0, 40);
        updated.push(`@${bp.profile.instagramHandle}`);
      }
      if (typeof args.currency === 'string') {
        const code = args.currency.toUpperCase() as CurrencyCode;
        if (SUPPORTED_CURRENCIES[code]) {
          bp.profile.currency = code;
          bp.modules.services.currency = code;
          updated.push(`currency=${code}`);
        }
      }
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: updated.length > 0 ? `Updated profile (${updated.join(', ')})` : 'Profile unchanged',
        data: { updated },
      };
    }

    case 'customize_template_copy': {
      const allowedKeys = [
        'heroBadge',
        'primaryCta',
        'servicesEyebrow',
        'servicesHeading',
        'serviceItemCta',
        'portfolioEyebrow',
        'portfolioHeading',
        'enquiryEyebrow',
        'enquiryHeading',
        'enquirySubheading',
        'testimonialsHeading',
        'faqHeading',
      ] as const;
      const updatedKeys: string[] = [];
      const nextCopy = { ...(bp.customCopy || {}) };
      for (const k of allowedKeys) {
        if (typeof args[k] === 'string' && args[k].trim()) {
          nextCopy[k] = args[k].trim().slice(0, 180);
          updatedKeys.push(k);
        }
      }
      bp.customCopy = nextCopy;
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: updatedKeys.length > 0 ? `Updated template copy (${updatedKeys.join(', ')})` : 'Template copy unchanged',
        data: { updatedKeys, customCopy: nextCopy },
      };
    }

    case 'customize_template_design': {
      const activeTpl = resolveTemplateEngineId(bp.templateId);
      const scopedMap: Record<string, TemplateDesignOverrides> = { ...(bp.templateDesignOverrides || {}) };
      if (args.resetToDefaults) {
        scopedMap[activeTpl] = {};
        bp.templateDesignOverrides = scopedMap;
        bp.designOverrides = {};
        bp.updatedAt = new Date().toISOString();
        return {
          ok: true,
          blueprint: bp,
          changeSummary: `Restored ${TEMPLATE_ENGINES[activeTpl].name} native defaults (other templates untouched)`,
          data: { templateId: activeTpl, designOverrides: {}, templateDesignOverrides: scopedMap },
        };
      }
      const nextDesign: TemplateDesignOverrides = {
        ...(scopedMap[activeTpl] || bp.designOverrides || {}),
      };
      const changed: string[] = [];
      const accent = normalizeSafeHex(args.accentColor);
      if (accent) {
        nextDesign.accentColor = accent;
        changed.push(`accent=${accent}`);
      }
      const bg = normalizeSafeHex(args.backgroundColor);
      if (bg) {
        nextDesign.backgroundColor = bg;
        changed.push(`background=${bg}`);
      }
      const surface = normalizeSafeHex(args.surfaceColor);
      if (surface) {
        nextDesign.surfaceColor = surface;
        changed.push(`surface=${surface}`);
      }
      const ink = normalizeSafeHex(args.textColor);
      if (ink) {
        nextDesign.textColor = ink;
        changed.push(`text=${ink}`);
      }
      if (args.buttonRadius === 'pill' || args.buttonRadius === 'rounded' || args.buttonRadius === 'sharp') {
        nextDesign.buttonRadius = args.buttonRadius;
        changed.push(`buttons=${args.buttonRadius}`);
      }
      if (args.fontMood === 'editorial_serif' || args.fontMood === 'modern_sans' || args.fontMood === 'bold_display') {
        nextDesign.fontMood = args.fontMood;
        changed.push(`font=${args.fontMood}`);
      }
      if (args.pagePaddingX === 'compact' || args.pagePaddingX === 'normal' || args.pagePaddingX === 'spacious') {
        nextDesign.pagePaddingX = args.pagePaddingX;
        changed.push(`paddingX=${args.pagePaddingX}`);
      }
      if (args.sectionSpacing === 'compact' || args.sectionSpacing === 'normal' || args.sectionSpacing === 'airy') {
        nextDesign.sectionSpacing = args.sectionSpacing;
        changed.push(`spacing=${args.sectionSpacing}`);
      }
      if (
        args.heroImageAspect === 'auto' ||
        args.heroImageAspect === 'square' ||
        args.heroImageAspect === 'landscape' ||
        args.heroImageAspect === 'portrait' ||
        args.heroImageAspect === 'wide'
      ) {
        nextDesign.heroImageAspect = args.heroImageAspect;
        changed.push(`heroAspect=${args.heroImageAspect}`);
      }
      if (typeof args.heroImageMaxHeight === 'number' && !Number.isNaN(args.heroImageMaxHeight)) {
        const clamped = Math.min(680, Math.max(180, Math.round(args.heroImageMaxHeight)));
        nextDesign.heroImageMaxHeight = clamped;
        changed.push(`heroMaxH=${clamped}px`);
      }
      if (
        args.heroImageShape === 'arch' ||
        args.heroImageShape === 'rounded' ||
        args.heroImageShape === 'card' ||
        args.heroImageShape === 'circle'
      ) {
        nextDesign.heroImageShape = args.heroImageShape;
        changed.push(`heroShape=${args.heroImageShape}`);
      }
      if (args.heroImageFit === 'cover' || args.heroImageFit === 'contain') {
        nextDesign.heroImageFit = args.heroImageFit;
        changed.push(`heroFit=${args.heroImageFit}`);
      }
      if (typeof args.galleryColumns === 'number' && !Number.isNaN(args.galleryColumns)) {
        const cols = Math.min(4, Math.max(1, Math.round(args.galleryColumns)));
        nextDesign.galleryColumns = cols;
        changed.push(`galleryCols=${cols}`);
      }
      scopedMap[activeTpl] = nextDesign;
      bp.templateDesignOverrides = scopedMap;
      bp.designOverrides = nextDesign;
      bp.updatedAt = new Date().toISOString();
      return {
        ok: changed.length > 0,
        blueprint: bp,
        changeSummary:
          changed.length > 0
            ? `Customized ${TEMPLATE_ENGINES[activeTpl].name} design (${changed.join(', ')})`
            : 'No valid design or layout tokens specified',
        ...(changed.length === 0
          ? { error: 'Pass hex colors, buttonRadius, fontMood, pagePaddingX, sectionSpacing, heroImage*, or galleryColumns.' }
          : {}),
        data: { templateId: activeTpl, designOverrides: nextDesign },
      };
    }

    case 'toggle_section_visibility': {
      const valid = ['hero', 'services', 'portfolio', 'testimonials', 'faq', 'booking'];
      const sec = String(args.section || '').trim().toLowerCase();
      if (!valid.includes(sec)) {
        return { ok: false, blueprint: bp, changeSummary: 'Invalid section name', error: `Section must be one of: ${valid.join(', ')}` };
      }
      const visible = Boolean(args.visible);
      bp.sectionVisibility = { ...(bp.sectionVisibility || {}), [sec]: visible };
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `${visible ? 'Shown' : 'Hidden'} "${sec}" section`,
        data: { section: sec, visible, sectionVisibility: bp.sectionVisibility },
      };
    }

    case 'upsert_service_package': {
      const cleanName = String(args.name || '').trim().slice(0, 80);
      if (!cleanName) {
        return { ok: false, blueprint: bp, changeSummary: 'Missing service name', error: 'Service name is required' };
      }

      const items = bp.modules.services.items || [];
      const existingIdx = items.findIndex(
        (s) => (args.id && s.id === args.id) || s.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (existingIdx === -1 && plan !== 'pro' && items.length >= FREE_PLAN_SERVICE_LIMIT) {
        return {
          ok: false,
          blueprint: bp,
          changeSummary: `Free plan limit (${FREE_PLAN_SERVICE_LIMIT} services)`,
          error: `Free plan supports up to ${FREE_PLAN_SERVICE_LIMIT} services. Upgrade to Pro for unlimited packages.`,
        };
      }

      const numericPrice = typeof args.price === 'number' && !Number.isNaN(args.price) ? Math.max(0, args.price) : 0;
      const requestedMode = args.priceMode as ServicePriceMode | undefined;
      const finalMode: ServicePriceMode =
        numericPrice <= 0 ? 'quote' : requestedMode && ['fixed', 'starting_at', 'quote'].includes(requestedMode) ? requestedMode : 'fixed';

      if (existingIdx >= 0) {
        const cur = items[existingIdx];
        items[existingIdx] = {
          ...cur,
          name: cleanName,
          price: args.price !== undefined ? numericPrice : cur.price,
          priceMode: args.price !== undefined || requestedMode ? finalMode : cur.priceMode,
          description: typeof args.description === 'string' ? args.description.trim().slice(0, 220) : cur.description,
          durationMinutes: typeof args.durationMinutes === 'number' ? args.durationMinutes : cur.durationMinutes,
          tag: typeof args.tag === 'string' ? args.tag.trim().toUpperCase().slice(0, 20) : cur.tag,
        };
        bp.modules.services.items = items;
        bp.updatedAt = new Date().toISOString();
        return {
          ok: true,
          blueprint: bp,
          changeSummary: `Updated service "${cleanName}"`,
          data: { service: items[existingIdx] },
        };
      }

      const created = {
        id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        price: numericPrice,
        priceMode: finalMode,
        durationMinutes: typeof args.durationMinutes === 'number' ? args.durationMinutes : 60,
        locationType: 'in_studio' as const,
        description: typeof args.description === 'string' ? args.description.trim().slice(0, 220) : '',
        tag: typeof args.tag === 'string' ? args.tag.trim().toUpperCase().slice(0, 20) : 'SIGNATURE',
        enabled: true,
      };
      bp.modules.services.items = [...items, created];
      bp.updatedAt = new Date().toISOString();
      const sym = SUPPORTED_CURRENCIES[bp.profile.currency || 'NGN']?.symbol || '₦';
      const priceStr = finalMode === 'quote' ? 'Custom Quote' : `${finalMode === 'starting_at' ? 'From ' : ''}${sym}${numericPrice.toLocaleString('en-US')}`;
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Added service "${cleanName}" (${priceStr})`,
        data: { service: created },
      };
    }

    case 'delete_service_package': {
      const before = bp.modules.services.items.length;
      const targetName = String(args.name || '').trim().toLowerCase();
      bp.modules.services.items = bp.modules.services.items.filter(
        (s) => !(args.id && s.id === args.id) && !(targetName && s.name.toLowerCase() === targetName)
      );
      const removed = before - bp.modules.services.items.length;
      bp.updatedAt = new Date().toISOString();
      return {
        ok: removed > 0,
        blueprint: bp,
        changeSummary: removed > 0 ? `Removed service package` : 'Matching service not found',
        ...(removed === 0 ? { error: 'No matching service found to remove.' } : {}),
      };
    }

    case 'upsert_product_item': {
      const cleanName = String(args.name || '').trim().slice(0, 80);
      if (!cleanName) {
        return { ok: false, blueprint: bp, changeSummary: 'Missing product name', error: 'Product name is required.' };
      }
      const items = bp.modules.products?.items || [];
      const idx = items.findIndex((p) => (args.id && p.id === args.id) || p.name.toLowerCase() === cleanName.toLowerCase());
      const numPrice = typeof args.price === 'number' && !Number.isNaN(args.price) ? Math.max(0, args.price) : 0;
      if (idx >= 0) {
        items[idx] = {
          ...items[idx],
          name: cleanName,
          price: args.price !== undefined ? numPrice : items[idx].price,
          description: typeof args.description === 'string' ? args.description.trim().slice(0, 220) : items[idx].description,
          inStock: typeof args.inStock === 'boolean' ? args.inStock : items[idx].inStock,
        };
        bp.modules.products.items = items;
        bp.updatedAt = new Date().toISOString();
        return { ok: true, blueprint: bp, changeSummary: `Updated product "${cleanName}"` };
      }
      const created = {
        id: `prd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        price: numPrice,
        inStock: typeof args.inStock === 'boolean' ? args.inStock : true,
        description: typeof args.description === 'string' ? args.description.trim().slice(0, 220) : '',
        enabled: true,
      };
      bp.modules.products = {
        enabled: true,
        currency: bp.profile.currency || 'NGN',
        items: [...items, created],
      };
      bp.updatedAt = new Date().toISOString();
      return { ok: true, blueprint: bp, changeSummary: `Added product "${cleanName}"` };
    }

    case 'delete_product_item': {
      const items = bp.modules.products?.items || [];
      const targetName = String(args.name || '').trim().toLowerCase();
      const filtered = items.filter(
        (p) => !(args.id && p.id === args.id) && !(targetName && p.name.toLowerCase() === targetName)
      );
      const removed = items.length - filtered.length;
      if (bp.modules.products) bp.modules.products.items = filtered;
      bp.updatedAt = new Date().toISOString();
      return {
        ok: removed > 0,
        blueprint: bp,
        changeSummary: removed > 0 ? 'Removed product item' : 'Product not found',
        ...(removed === 0 ? { error: 'No matching product found.' } : {}),
      };
    }

    case 'upsert_testimonial': {
      const clientName = String(args.clientName || '').trim().slice(0, 80);
      const list = bp.testimonials || [];
      if (args.remove) {
        const next = list.filter(
          (t) => !(args.id && t.id === args.id) && !(clientName && t.clientName.toLowerCase() === clientName.toLowerCase())
        );
        bp.testimonials = next;
        bp.updatedAt = new Date().toISOString();
        return { ok: next.length < list.length, blueprint: bp, changeSummary: `Removed testimonial` };
      }
      const quote = String(args.quote || '').trim().slice(0, 320);
      if (!clientName || !quote) {
        return { ok: false, blueprint: bp, changeSummary: 'Client name and quote required', error: 'clientName and quote are required.' };
      }
      const existingIdx = list.findIndex((t) => (args.id && t.id === args.id) || t.clientName.toLowerCase() === clientName.toLowerCase());
      if (existingIdx >= 0) {
        list[existingIdx] = {
          ...list[existingIdx],
          clientName,
          quote,
          ...(typeof args.roleOrEvent === 'string' ? { roleOrEvent: args.roleOrEvent.trim().slice(0, 60) } : {}),
        };
        bp.testimonials = list;
      } else {
        bp.testimonials = [
          ...list,
          {
            id: `tst-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            clientName,
            quote,
            ...(typeof args.roleOrEvent === 'string' ? { roleOrEvent: args.roleOrEvent.trim().slice(0, 60) } : {}),
          },
        ];
      }
      bp.sectionVisibility = { ...(bp.sectionVisibility || {}), testimonials: true };
      bp.updatedAt = new Date().toISOString();
      return { ok: true, blueprint: bp, changeSummary: `Saved testimonial from "${clientName}"` };
    }

    case 'upsert_faq': {
      const question = String(args.question || '').trim().slice(0, 160);
      const list = bp.faqs || [];
      if (args.remove) {
        const next = list.filter(
          (f) => !(args.id && f.id === args.id) && !(question && f.question.toLowerCase() === question.toLowerCase())
        );
        bp.faqs = next;
        bp.updatedAt = new Date().toISOString();
        return { ok: next.length < list.length, blueprint: bp, changeSummary: `Removed FAQ item` };
      }
      const answer = String(args.answer || '').trim().slice(0, 400);
      if (!question || !answer) {
        return { ok: false, blueprint: bp, changeSummary: 'Question and answer required', error: 'question and answer are required.' };
      }
      const existingIdx = list.findIndex((f) => (args.id && f.id === args.id) || f.question.toLowerCase() === question.toLowerCase());
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], question, answer };
        bp.faqs = list;
      } else {
        bp.faqs = [
          ...list,
          { id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, question, answer },
        ];
      }
      bp.sectionVisibility = { ...(bp.sectionVisibility || {}), faq: true };
      bp.updatedAt = new Date().toISOString();
      return { ok: true, blueprint: bp, changeSummary: `Saved FAQ: "${question}"` };
    }

    case 'switch_template_style': {
      const prevTpl = resolveTemplateEngineId(bp.templateId);
      const resolved = resolveTemplateEngineId(String(args.templateId || 'editorial-atelier'));
      const scopedMap: Record<string, TemplateDesignOverrides> = { ...(bp.templateDesignOverrides || {}) };
      if (prevTpl !== resolved) {
        if (bp.designOverrides && Object.keys(bp.designOverrides).length > 0 && !scopedMap[prevTpl]) {
          scopedMap[prevTpl] = { ...bp.designOverrides };
        }
        bp.templateDesignOverrides = scopedMap;
        bp.designOverrides = scopedMap[resolved] ? { ...scopedMap[resolved] } : {};
      }
      bp.templateId = resolved;
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Switched template style to ${TEMPLATE_ENGINES[resolved].name}`,
        data: {
          templateId: resolved,
          templateName: TEMPLATE_ENGINES[resolved].name,
          designOverrides: bp.designOverrides || {},
        },
      };
    }

    case 'switch_niche_blueprint': {
      const resolved = resolveNicheBlueprint(String(args.nicheId || 'beauty_makeup'));
      bp.nicheId = resolved.id;
      bp.profile.nicheId = resolved.id;
      bp.profile.category = resolved.label;
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Switched vendor niche to ${resolved.label}`,
        data: { nicheId: resolved.id, label: resolved.label },
      };
    }

    case 'configure_whatsapp': {
      const changed: string[] = [];
      if (typeof args.phoneNumber === 'string' && args.phoneNumber.trim()) {
        const cleanDigits = args.phoneNumber.replace(/[^\d]/g, '');
        bp.modules.whatsapp.phoneNumber = cleanDigits;
        bp.profile.whatsapp = cleanDigits;
        changed.push(`WhatsApp +${cleanDigits}`);
      }
      if (typeof args.bookingTemplate === 'string' && args.bookingTemplate.trim()) {
        bp.modules.whatsapp.defaultBookingTemplate = args.bookingTemplate.trim().slice(0, 300);
        changed.push('booking message template');
      }
      if (typeof args.floatingWidgetEnabled === 'boolean') {
        bp.modules.whatsapp.floatingWidgetEnabled = args.floatingWidgetEnabled;
        changed.push(`floating widget ${args.floatingWidgetEnabled ? 'on' : 'off'}`);
      }
      if (typeof args.floatingWidgetGreeting === 'string' && args.floatingWidgetGreeting.trim()) {
        bp.modules.whatsapp.floatingWidgetGreeting = args.floatingWidgetGreeting.trim().slice(0, 80);
        changed.push('floating widget greeting');
      }
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: changed.length > 0 ? `Updated ${changed.join(' & ')}` : 'WhatsApp settings unchanged',
      };
    }

    case 'promote_media_to_hero': {
      const vault = bp.mediaVault || [];
      if (vault.length === 0) {
        return {
          ok: false,
          blueprint: bp,
          changeSummary: 'Media Vault is empty',
          error: 'No photos in Media Vault yet. Upload or sync photos first.',
        };
      }
      let targetIdx = -1;
      if (typeof args.assetId === 'string' && args.assetId) {
        targetIdx = vault.findIndex((m) => m.id === args.assetId);
      } else if (typeof args.photoNumber === 'number' && args.photoNumber >= 1 && args.photoNumber <= vault.length) {
        targetIdx = Math.floor(args.photoNumber) - 1;
      } else if (typeof args.query === 'string' && args.query.trim()) {
        const q = args.query.trim().toLowerCase();
        targetIdx = vault.findIndex((m) => (m.name || '').toLowerCase().includes(q) || (m.caption || '').toLowerCase().includes(q));
      }
      if (targetIdx === -1) {
        return { ok: false, blueprint: bp, changeSummary: 'Photo not found', error: 'Could not find that photo in Media Vault.' };
      }
      const picked = { ...vault[targetIdx], type: 'hero' as const };
      const rest = vault.filter((_, i) => i !== targetIdx).map((m) => (m.type === 'hero' ? { ...m, type: 'gallery' as const } : m));
      bp.mediaVault = [picked, ...rest];
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Promoted "${picked.name}" to Hero Cover photo`,
        data: { heroAssetId: picked.id, heroName: picked.name },
      };
    }

    default:
      return {
        ok: false,
        blueprint: bp,
        changeSummary: `Unknown tool: ${toolName}`,
        error: `Tool "${toolName}" is not supported.`,
      };
  }
}
