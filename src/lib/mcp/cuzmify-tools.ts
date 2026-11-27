import { SchemaType, type FunctionDeclaration } from '@google/generative-ai';
import {
  BLUEPRINT_INJECTION_SLOTS,
  SUPPORTED_CURRENCIES,
  type BlueprintSlotId,
  type BusinessBlueprint,
  type CurrencyCode,
  type ServicePriceMode,
  type TemplateDesignOverrides,
} from '@/core/blueprint-schema';
import { resolveNicheBlueprint } from '@/core/niche-blueprints';
import { resolveTemplateEngineId, TEMPLATE_ENGINES } from '@/core/template-engines';
import { FREE_PLAN_SERVICE_LIMIT } from '@/lib/billing-constants';
import {
  getAssetPosterUrl,
  getAssetRenderSource,
  isVideoMediaUrl,
  resolveAssetMediaKind,
} from '@/core/media-utils';
import { inspectRenderedSite, type SiteAccountMeta } from './site-inspector';

export interface McpToolProperty {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  enum?: string[];
  items?: {
    type: 'string' | 'object';
    properties?: Record<string, { type: 'string'; description: string }>;
  };
}

export interface McpToolAnnotations {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  annotations: McpToolAnnotations;
  inputSchema: {
    type: 'object';
    properties: Record<string, McpToolProperty>;
    required?: string[];
  };
}

const READ_ONLY_ANNOTATIONS: McpToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const MUTATE_IDEMPOTENT_ANNOTATIONS: McpToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const MUTATE_NON_IDEMPOTENT_ANNOTATIONS: McpToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
};

const DESTRUCTIVE_ANNOTATIONS: McpToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
};

export const CUZMIFY_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'get_site_blueprint',
    description:
      'Read-only. Return editable website data and content inventory: active templateId, publish status (draft or live) and liveUrl, services (with IDs), products (with IDs), mediaItems (use its photoNumber and id for media/service tools), customSections, FAQs, testimonials, copy overrides, SEO config, active injection slot names, and all account sites. Use this first to read content and look up IDs before editing. For rendered HTML/CSS, WCAG contrast audit, viewport layout settings, or QA findings, call inspect_rendered_page instead. Draft vs live note: mutating tools save immediately (updating draft, or live output if already published); call publish_site / unpublish_site to change online visibility. Pass siteId to inspect a specific site with full contact fields; omit siteId for the default site summary.',
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID from accountSites; omit for the default site.' },
      },
    },
  },
  {
    name: 'inspect_rendered_page',
    description:
      'Read-only visual and DOM audit of the rendered website: exact CSS palette, WCAG contrast ratios, effective per-device design tokens (mobile/tablet/desktop), top-to-bottom section DOM tree, skipped sections with reasons, media dimensions/roles, SEO audit score, and automated QA warnings. Use this to verify rendered appearance and contrast; use get_site_blueprint to read editable content and IDs. Defaults: viewport="all", includeHtml=false, includeCss=false, includeImages=true (note includeHtml/includeCss return large compiled strings).',
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        viewport: {
          type: 'string',
          description: 'Focus effective breakpoint telemetry on all, mobile, tablet, or desktop (default: "all").',
          enum: ['all', 'mobile', 'tablet', 'desktop'],
        },
        includeHtml: {
          type: 'boolean',
          description: 'Include full compiled rendered HTML string (default: false; output can be large).',
        },
        includeCss: {
          type: 'boolean',
          description: 'Include full compiled rendered CSS string (default: false; output can be large).',
        },
        includeImages: {
          type: 'boolean',
          description: 'Include Media Vault image blocks alongside audit report for multimodal clients (default: true).',
        },
      },
    },
  },
  {
    name: 'update_business_profile',
    description:
      'Partial-update the business identity and primary Hero headline/bio (name, headline <h1>, bio hero subheadline, city, country, currency, email, instagramHandle). Omitted fields remain unchanged; never invents unrequested prices. For heroBadge, CTA button text, or section headings (servicesHeading, portfolioHeading, enquiryHeading), use customize_template_copy.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        name: { type: 'string', description: 'Business / studio name.' },
        headline: { type: 'string', description: 'Main Hero <h1> headline shown at the top of the website.' },
        bio: { type: 'string', description: 'Main Hero subheadline / business bio description.' },
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
      'Partial-update template labels, badges, CTA buttons, and section headings (heroBadge, primaryCta, submitButtonText, servicesHeading, portfolioHeading, enquiryHeading, etc.) without resetting omitted fields. For the main Hero headline (<h1>), hero bio, business name, or city, use update_business_profile.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
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
        submitButtonText: { type: 'string', description: 'Exact booking/enquiry submit button label (e.g. Send Enquiry →, Order via WhatsApp →).' },
        testimonialsHeading: { type: 'string', description: 'Heading for client testimonials section.' },
        faqHeading: { type: 'string', description: 'Heading for FAQ section.' },
      },
    },
  },
  {
    name: 'customize_template_design',
    description:
      'Partial-update brand palette colors, button corners/icons/colors, fonts, hero/services layouts, and device-isolated spacing/grid overrides ("all", "mobile", "tablet", or "desktop"), plus optional style-only customCss on existing template selectors. Decision rule for markup/CSS: use customCss here only for styling existing elements (padding, shadows, @media tweaks); use inject_slot to place small HTML/SVG widgets in 12 fixed template anchors; use upsert_custom_section to add a full standalone page section.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        device: {
          type: 'string',
          description: 'Target screen scope for layout/padding/hero sizing overrides ("all" default, or isolate strictly to "mobile", "tablet", or "desktop").',
          enum: ['all', 'mobile', 'tablet', 'desktop'],
        },
        accentColor: { type: 'string', description: 'Hex brand accent color (e.g. #D97706, #0D5771, #E11D48).' },
        backgroundColor: { type: 'string', description: 'Hex page background color (e.g. #FAF7F2, #09090B).' },
        surfaceColor: { type: 'string', description: 'Hex card/panel surface color (e.g. #FFFFFF, #18181B).' },
        textColor: { type: 'string', description: 'Hex primary text color (e.g. #1C1917, #FAFAFA).' },
        buttonRadius: {
          type: 'string',
          description: 'Corner style for buttons and CTAs.',
          enum: ['pill', 'rounded', 'sharp'],
        },
        submitButtonIcon: {
          type: 'string',
          description: 'Icon rendered on the booking form submit button (.cz-submit-btn): "whatsapp" shows WhatsApp SVG even before phone setup.',
          enum: ['auto', 'whatsapp', 'sparkles', 'calendar', 'none'],
        },
        submitButtonColor: {
          type: 'string',
          description: 'Hex background color override for the booking submit button (e.g. #25D366, #0D5771).',
        },
        customCss: {
          type: 'string',
          description: 'Style-only scoped CSS rules targeting existing elements without adding HTML DOM nodes. Pass "" to clear.',
        },
        fontMood: {
          type: 'string',
          description: 'Typography pairing mood.',
          enum: ['editorial_serif', 'modern_sans', 'bold_display'],
        },
        heroLayout: {
          type: 'string',
          description: 'Hero layout arrangement ("split", "centered", "full_bleed", or "minimal_card").',
          enum: ['split', 'centered', 'full_bleed', 'minimal_card'],
        },
        servicesLayout: {
          type: 'string',
          description: 'Services section structural presentation ("editorial_list", "card_grid", or "compact_menu").',
          enum: ['editorial_list', 'card_grid', 'compact_menu'],
        },
        heroTextAlign: {
          type: 'string',
          description: 'Align Hero headline, bio & CTA buttons left or centered (great for mobile isolation).',
          enum: ['left', 'center'],
        },
        hideHeroImage: {
          type: 'boolean',
          description: 'Hide or show the hero image container cleanly on the chosen device scope.',
        },
        fontScale: {
          type: 'string',
          description: 'Headline display scale on the target device.',
          enum: ['compact', 'normal', 'large'],
        },
        pagePaddingX: {
          type: 'string',
          description: 'Horizontal page margin/padding preset on the target device.',
          enum: ['compact', 'normal', 'spacious'],
        },
        sectionSpacing: {
          type: 'string',
          description: 'Vertical padding rhythm between sections on the target device.',
          enum: ['compact', 'normal', 'airy'],
        },
        heroImageAspect: {
          type: 'string',
          description: 'Hero image frame aspect ratio.',
          enum: ['auto', 'square', 'landscape', 'portrait', 'wide'],
        },
        heroImageMaxHeight: {
          type: 'number',
          description: 'Maximum height in pixels for the Hero image frame (140 to 680).',
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
        servicesColumns: {
          type: 'number',
          description: 'Services grid columns (1 to 3).',
        },
        resetToDefaults: {
          type: 'boolean',
          description: 'Set true to clear custom overrides for the active template (or just the targeted device scope).',
        },
      },
    },
  },
  {
    name: 'reorder_sections',
    description:
      'Set the top-to-bottom section order for the active template (hero, services, portfolio, custom, testimonials, faq, booking). Missing keys are appended automatically.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        order: {
          type: 'array',
          description: 'Ordered list of section keys: hero, services, portfolio, custom, testimonials, faq, booking.',
          items: { type: 'string' },
        },
      },
      required: ['order'],
    },
  },
  {
    name: 'upsert_custom_section',
    description:
      'Create, update, or permanently remove (remove=true) a full standalone content section (cards, checklist, hours_info, banner_cta, or custom_html block) included in reorder_sections. Matches existing section by id first, then case-insensitive title; note provided fields replace that section configuration. Decision rule: use this for standalone page sections; use inject_slot to place banners/icons/footers into existing template slots; use customize_template_design.customCss for CSS-only styling.',
    annotations: MUTATE_NON_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        id: { type: 'string', description: 'Existing custom section ID to update or remove (matched before title).' },
        title: { type: 'string', description: 'Section heading (e.g. Studio Hours & Policy, How Booking Works).' },
        eyebrow: { type: 'string', description: 'Optional small label above title.' },
        subtitle: { type: 'string', description: 'Optional intro paragraph below title.' },
        layout: {
          type: 'string',
          description: 'Presentation style for this custom section ("custom_html" accepts custom sanitized inner HTML).',
          enum: ['cards', 'checklist', 'hours_info', 'banner_cta', 'custom_html'],
        },
        html: {
          type: 'string',
          description: 'Custom inner HTML markup when layout is "custom_html" (supports inline SVG, flexbox, grids, CSS vars).',
        },
        items: {
          type: 'array',
          description: 'Optional list of key-detail pairs shown inside the section.',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Card heading, checklist point, or day label.' },
              detail: { type: 'string', description: 'Supporting description or hours.' },
            },
          },
        },
        ctaText: { type: 'string', description: 'Optional CTA button text for banner_cta layout.' },
        ctaHref: { type: 'string', description: 'Optional CTA link (defaults to #booking).' },
        remove: { type: 'boolean', description: 'Set true to permanently delete the matching custom section by id or title.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'inject_slot',
    description:
      'Inject, replace, or clear (clear=true) sanitized HTML/SVG inside one of 12 fixed anchors in the template engine (top_bar, nav_actions, hero_above, hero_cta_after, hero_below, services_above, services_below, booking_above, submit_button_prefix, submit_button_suffix, booking_below, footer), with optional scoped CSS appended cleanly. Decision rule: use inject_slot for icons, ribbons, badges, announcements, and footers inside existing page areas; use upsert_custom_section for full standalone sections; use customize_template_design.customCss for style-only rules.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        slot: {
          type: 'string',
          description: 'Named injection anchor inside the active template.',
          enum: [...BLUEPRINT_INJECTION_SLOTS],
        },
        html: {
          type: 'string',
          description: 'Sanitized HTML or inline SVG to inject into the slot (supports CSS vars like var(--cz-accent)).',
        },
        css: {
          type: 'string',
          description: 'Optional sanitized CSS rule(s) appended into the active template stylesheet.',
        },
        clear: {
          type: 'boolean',
          description: 'Set true to clear injected HTML from this slot cleanly.',
        },
      },
      required: ['slot'],
    },
  },
  {
    name: 'configure_seo',
    description:
      'Partial-update SSR search engine metadata (metaTitle, metaDescription, keywords, canonicalUrl, ogImageUrl, noIndex) and Schema.org LocalBusiness/Service JSON-LD structured data. Omitted fields remain unchanged; pass empty strings to clear optional URLs or text fields.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        metaTitle: { type: 'string', description: 'Custom <title> tag (30-60 chars recommended).' },
        metaDescription: { type: 'string', description: 'Custom meta description (70-160 chars recommended).' },
        keywords: {
          type: 'array',
          description: 'Target search keywords (e.g. ["bridal makeup lagos", "editorial makeup artist"]).',
          items: { type: 'string' },
        },
        canonicalUrl: { type: 'string', description: 'Custom canonical URL (https://...).' },
        ogImageUrl: { type: 'string', description: 'Public https:// OpenGraph share image URL.' },
        noIndex: { type: 'boolean', description: 'Set true to hide site from search engine indexing.' },
        schemaType: {
          type: 'string',
          description: 'Schema.org JSON-LD entity type.',
          enum: ['LocalBusiness', 'BeautySalon', 'PhotographyBusiness', 'EventVenue', 'Bakery', 'ProfessionalService'],
        },
        priceRange: { type: 'string', description: 'Schema priceRange indicator (e.g. ₦₦, $$$).' },
        openingHours: { type: 'string', description: 'Schema openingHours (e.g. Tu-Sa 09:00-19:00).' },
        areaServed: { type: 'string', description: 'Service area served (e.g. Lagos, Abuja, Worldwide).' },
      },
    },
  },
  {
    name: 'toggle_section_visibility',
    description: 'Non-destructively show or hide a built-in page section (hero, services, portfolio, testimonials, faq, booking) without deleting its underlying data.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
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
      'Add a service package or partial-update an existing one. Matches by id first, then case-insensitive exact name; omitted fields stay unchanged. Supports optional imageUrl (or "" to remove image), mediaAssetId, or 1-based photoNumber from get_site_blueprint mediaItems. Use priceMode="quote" with price=0 when pricing is custom/unstated.',
    annotations: MUTATE_NON_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        id: { type: 'string', description: 'Existing service ID to update (matched before name).' },
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
        imageUrl: {
          type: 'string',
          description: 'Public https:// image or video URL (or empty string "" to remove the current service media).',
        },
        mediaAssetId: {
          type: 'string',
          description: 'Media Vault asset ID from mediaItems (photo or video) to attach as the service media.',
        },
        photoNumber: {
          type: 'number',
          description: '1-based item number from mediaItems (photo or video) to attach as the service media (e.g. 1, 2).',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_service_package',
    description: 'Permanently delete a service package from the catalog (irreversible). Matches by id first, or case-insensitive exact name if id is omitted; at least one of id or name must match.',
    annotations: DESTRUCTIVE_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        id: { type: 'string', description: 'Service ID to delete (checked before name).' },
        name: { type: 'string', description: 'Case-insensitive exact service name when ID is not known.' },
      },
    },
  },
  {
    name: 'upsert_product_item',
    description:
      'Add a new product or partial-update an existing physical/digital product. Matches by id first, then case-insensitive exact name; omitted fields stay unchanged.',
    annotations: MUTATE_NON_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        id: { type: 'string', description: 'Existing product ID to update (matched before name).' },
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
    description: 'Permanently delete a product from the catalog (irreversible). Matches by id first, or case-insensitive exact name.',
    annotations: DESTRUCTIVE_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        id: { type: 'string', description: 'Product ID (checked before name).' },
        name: { type: 'string', description: 'Case-insensitive exact product name.' },
      },
    },
  },
  {
    name: 'upsert_testimonial',
    description:
      'Add, update, or permanently remove (remove=true) a real client testimonial supplied by the vendor (never fabricate quotes). Matches by id first, then case-insensitive exact clientName.',
    annotations: MUTATE_NON_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        id: { type: 'string', description: 'Testimonial ID (matched before clientName).' },
        clientName: { type: 'string', description: 'Client name (must come from vendor, never invented).' },
        quote: { type: 'string', description: 'Exact client testimonial quote (required unless remove=true).' },
        roleOrEvent: { type: 'string', description: 'Optional event/context like Bridal Client.' },
        remove: { type: 'boolean', description: 'Set true to permanently delete matching testimonial by id or clientName.' },
      },
      required: ['clientName'],
    },
  },
  {
    name: 'upsert_faq',
    description:
      'Add, update, or permanently remove (remove=true) a Frequently Asked Question item. Matches by id first, then case-insensitive exact question.',
    annotations: MUTATE_NON_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        id: { type: 'string', description: 'FAQ ID (matched before question).' },
        question: { type: 'string', description: 'Customer question.' },
        answer: { type: 'string', description: 'Clear vendor answer (required unless remove=true).' },
        remove: { type: 'boolean', description: 'Set true to permanently delete matching FAQ.' },
      },
      required: ['question'],
    },
  },
  {
    name: 'switch_template_style',
    description:
      'Losslessly switch the active visual template engine (editorial-atelier, noir-showcase, or modern-studio) while preserving all content and per-template overrides. Call only when the user requests changing overall template theme/style.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
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
      'Switch the service vendor industry niche blueprint (adapts default section headings, booking CTA wording, and enquiry form prompts without overwriting custom overrides).',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
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
    description: 'Partial-update WhatsApp booking phone number, pre-filled enquiry template, or floating chat widget settings. Omitted fields remain unchanged.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
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
    description: 'Set an existing Media Vault photo or video reel as the main Hero cover media (matched by assetId first, then 1-based photoNumber from get_site_blueprint mediaItems, then name/caption query). Preserves mediaKind ("video" renders as <video>, "image" as <img>).',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        assetId: { type: 'string', description: 'Media asset ID from mediaItems.' },
        photoNumber: { type: 'number', description: '1-based index of the photo or video in the Media Vault.' },
        query: { type: 'string', description: 'Keyword to match asset name or caption.' },
      },
    },
  },
  {
    name: 'list_enquiries',
    description: 'Read-only. List recent client booking enquiries submitted on the website (ordered newest first). Returns count and bounded enquiry list.',
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
        limit: { type: 'number', description: 'Maximum leads to return (1-25, default: 10).' },
      },
    },
  },
  {
    name: 'publish_site',
    description:
      'Publish the website live (`status: "live"`) to its public `/s/<subdomain>` URL so clients can view and submit bookings. Edits saved while live update immediately; edits made in draft stay private until publish_site is called. To take a live site back offline, call unpublish_site.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
      },
    },
  },
  {
    name: 'unpublish_site',
    description:
      'Take a live website offline (`status: "draft"`) without deleting any content, designs, or bookings. Clients visiting the public link will no longer see the live site until publish_site is called again.',
    annotations: MUTATE_IDEMPOTENT_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
      },
    },
  },
];

const TOOL_DEFINITION_MAP = new Map<string, McpToolDefinition>(CUZMIFY_MCP_TOOLS.map((t) => [t.name, t]));

/**
 * Strictly validates runtime arguments against the tool's declared JSON inputSchema before execution.
 */
export function validateMcpToolArguments(
  toolName: string,
  rawArgs: unknown
): { valid: true; args: Record<string, any> } | { valid: false; error: string } {
  const def = TOOL_DEFINITION_MAP.get(toolName);
  if (!def) {
    return { valid: false, error: `Unknown MCP tool: "${toolName}"` };
  }

  if (rawArgs !== undefined && rawArgs !== null && (typeof rawArgs !== 'object' || Array.isArray(rawArgs))) {
    return { valid: false, error: `Invalid arguments for ${toolName}: expected an object.` };
  }
  const args = (rawArgs && typeof rawArgs === 'object' ? rawArgs : {}) as Record<string, unknown>;

  for (const reqKey of def.inputSchema.required || []) {
    if (args[reqKey] === undefined || args[reqKey] === null || args[reqKey] === '') {
      return { valid: false, error: `Missing required parameter "${reqKey}" for ${toolName}.` };
    }
  }

  for (const [key, value] of Object.entries(args)) {
    if (value === undefined) continue;
    const schema = def.inputSchema.properties[key];
    if (!schema) continue; // Tolerate harmless client metadata if not declared

    if (schema.type === 'string') {
      if (typeof value !== 'string') {
        return { valid: false, error: `Invalid type for "${key}": expected string, got ${typeof value}.` };
      }
      if (schema.enum && !schema.enum.includes(value)) {
        return {
          valid: false,
          error: `Invalid value "${value}" for "${key}". Expected one of: ${schema.enum.join(', ')}.`,
        };
      }
    } else if (schema.type === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return { valid: false, error: `Invalid type for "${key}": expected finite number.` };
      }
    } else if (schema.type === 'boolean') {
      if (typeof value !== 'boolean') {
        return { valid: false, error: `Invalid type for "${key}": expected boolean, got ${typeof value}.` };
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(value)) {
        return { valid: false, error: `Invalid type for "${key}": expected array.` };
      }
      if (schema.items?.type === 'string') {
        if (value.some((item) => typeof item !== 'string')) {
          return { valid: false, error: `Invalid element in "${key}": all items must be strings.` };
        }
      } else if (schema.items?.type === 'object') {
        if (value.some((item) => !item || typeof item !== 'object' || Array.isArray(item))) {
          return { valid: false, error: `Invalid element in "${key}": all items must be objects.` };
        }
      }
    }
  }

  return { valid: true, args };
}

/** Converts MCP JSON schemas into Gemini SDK FunctionDeclaration format. */
export function toGeminiFunctionDeclarations(includeServerOnly = true): FunctionDeclaration[] {
  const excluded = includeServerOnly
    ? new Set<string>()
    : new Set(['list_enquiries', 'publish_site', 'unpublish_site']);
  return CUZMIFY_MCP_TOOLS.filter((t) => !excluded.has(t.name)).map((tool) => {
    const props: Record<string, any> = {};
    for (const [k, v] of Object.entries(tool.inputSchema.properties)) {
      if (k === 'siteId') continue; // Studio/account context supplies active site automatically
      if (v.type === 'array') {
        if (v.items?.type === 'object' && v.items.properties) {
          const nestedProps: Record<string, any> = {};
          for (const [nk, nv] of Object.entries(v.items.properties)) {
            nestedProps[nk] = { type: SchemaType.STRING, description: nv.description };
          }
          props[k] = {
            type: SchemaType.ARRAY,
            description: v.description,
            items: {
              type: SchemaType.OBJECT,
              properties: nestedProps,
            },
          };
        } else {
          props[k] = {
            type: SchemaType.ARRAY,
            description: v.description,
            items: { type: SchemaType.STRING },
          };
        }
        continue;
      }
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
  rawArgs: Record<string, any>,
  inputBlueprint: BusinessBlueprint,
  options?: { plan?: 'free' | 'pro'; siteMeta?: SiteAccountMeta }
): BlueprintToolExecutionResult {
  const validation = validateMcpToolArguments(toolName, rawArgs);
  if (!validation.valid) {
    return {
      ok: false,
      blueprint: inputBlueprint,
      changeSummary: validation.error,
      error: validation.error,
    };
  }
  const args = validation.args;
  const bp: BusinessBlueprint = JSON.parse(JSON.stringify(inputBlueprint));
  const plan = options?.plan === 'pro' ? 'pro' : 'free';

  switch (toolName) {
    case 'get_site_blueprint': {
      const inspection = inspectRenderedSite(bp, options?.siteMeta);
      const isExplicitSiteLookup = typeof args.siteId === 'string' && args.siteId.trim().length > 0;
      const maskDigits = (val: string) => {
        const clean = val.trim();
        if (!clean) return '';
        return clean.length > 4 ? `***${clean.slice(-4)}` : '***';
      };
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Read ${inspection.template.name} blueprint & content inventory`,
        data: {
          name: bp.profile.name,
          headline: inspection.copyMetrics.headline,
          bio: inspection.copyMetrics.subheadline,
          nicheId: bp.nicheId,
          templateId: inspection.template.id,
          templateName: inspection.template.name,
          templateTagline: inspection.template.tagline,
          currency: bp.profile.currency,
          city: bp.profile.city,
          country: bp.profile.country,
          instagramHandle: bp.profile.instagramHandle || '',
          whatsappConfigured: Boolean(bp.modules.whatsapp.phoneNumber),
          whatsapp: isExplicitSiteLookup ? bp.modules.whatsapp.phoneNumber : maskDigits(bp.modules.whatsapp.phoneNumber),
          customCopy: bp.customCopy || {},
          designOverrides: bp.designOverrides || {},
          templateDesignOverrides: bp.templateDesignOverrides || {},
          sectionVisibility: bp.sectionVisibility || {},
          servicesCount: bp.modules.services.items.length,
          services: bp.modules.services.items.map((s) => {
            const mediaKind = s.imageUrl ? (isVideoMediaUrl(s.imageUrl) ? 'video' : 'image') : null;
            return {
              id: s.id,
              name: s.name,
              price: s.price,
              priceMode: s.priceMode,
              hasImage: Boolean(s.imageUrl),
              mediaKind,
              imageUrl: s.imageUrl?.startsWith('data:')
                ? mediaKind === 'video'
                  ? '[embedded uploaded video]'
                  : '[embedded uploaded image]'
                : s.imageUrl || '',
            };
          }),
          productsCount: bp.modules.products?.items?.length || 0,
          products: (bp.modules.products?.items || []).map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            inStock: p.inStock,
          })),
          testimonialsCount: bp.testimonials?.length || 0,
          testimonials: (bp.testimonials || []).slice(0, 10),
          faqsCount: bp.faqs?.length || 0,
          faqs: (bp.faqs || []).slice(0, 15),
          customSections: bp.customSections || [],
          mediaCount: bp.mediaVault.length,
          mediaSummary: inspection.mediaSummary,
          mediaItems: inspection.mediaInventory,
          seo: bp.seo || {},
          activeInjections: inspection.activeInjections,
          availableSlots: inspection.availableSlots,
          status: inspection.account.status,
          published: inspection.account.status === 'live',
          liveUrl: inspection.account.liveUrl,
          subdomain: inspection.account.subdomain,
          customDomain: inspection.account.customDomain,
          account: inspection.account,
        },
      };
    }

    case 'inspect_rendered_page': {
      const inspection = inspectRenderedSite(bp, options?.siteMeta);
      const vp =
        args.viewport === 'mobile' || args.viewport === 'tablet' || args.viewport === 'desktop'
          ? args.viewport
          : 'all';
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Inspected rendered ${inspection.template.name} (${vp}) — ${inspection.renderedSections.length} active sections, ${inspection.qaFindings.length} QA notes`,
        data: {
          account: inspection.account,
          template: inspection.template,
          effectivePalette: inspection.effectivePalette,
          contrastAudit: inspection.contrastAudit,
          effectiveDesign:
            vp === 'all'
              ? inspection.effectiveDesign
              : {
                  viewport: vp,
                  ...(inspection.effectiveDesign as any)[vp],
                  servicesLayout: inspection.effectiveDesign.servicesLayout,
                  sectionOrder: inspection.effectiveDesign.sectionOrder,
                },
          renderedSections: inspection.renderedSections,
          skippedSections: inspection.skippedSections,
          copyMetrics: inspection.copyMetrics,
          mediaInventory: inspection.mediaInventory,
          mediaSummary: inspection.mediaSummary,
          seoAudit: inspection.seoAudit,
          activeInjections: inspection.activeInjections,
          availableSlots: inspection.availableSlots,
          qaFindings: inspection.qaFindings,
          renderedHtmlBytes: inspection.renderedHtmlBytes,
          renderedCssBytes: inspection.renderedCssBytes,
          ...(args.includeCss ? { css: inspection.rendered.css } : {}),
          ...(args.includeHtml ? { html: inspection.rendered.html } : {}),
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
        'submitButtonText',
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
      const scope: 'all' | 'mobile' | 'tablet' | 'desktop' =
        args.device === 'mobile' || args.device === 'tablet' || args.device === 'desktop'
          ? args.device
          : 'all';

      if (args.resetToDefaults) {
        const curTplOv: TemplateDesignOverrides = { ...(scopedMap[activeTpl] || bp.designOverrides || {}) };
        if (scope === 'all') {
          scopedMap[activeTpl] = {};
          bp.templateDesignOverrides = scopedMap;
          bp.designOverrides = {};
          bp.updatedAt = new Date().toISOString();
          return {
            ok: true,
            blueprint: bp,
            changeSummary: `Restored ${TEMPLATE_ENGINES[activeTpl].name} native defaults (other templates untouched)`,
            data: { templateId: activeTpl, device: 'all', designOverrides: {}, templateDesignOverrides: scopedMap },
          };
        }
        const nextResp = { ...(curTplOv.responsive || {}) };
        delete nextResp[scope];
        curTplOv.responsive = nextResp;
        scopedMap[activeTpl] = curTplOv;
        bp.templateDesignOverrides = scopedMap;
        bp.designOverrides = curTplOv;
        bp.updatedAt = new Date().toISOString();
        return {
          ok: true,
          blueprint: bp,
          changeSummary: `Cleared ${scope}-only overrides on ${TEMPLATE_ENGINES[activeTpl].name}`,
          data: { templateId: activeTpl, device: scope, designOverrides: curTplOv },
        };
      }

      const nextDesign: TemplateDesignOverrides = {
        ...(scopedMap[activeTpl] || bp.designOverrides || {}),
      };
      const targetSlice: Record<string, any> =
        scope === 'all'
          ? nextDesign
          : { ...((nextDesign.responsive && nextDesign.responsive[scope]) || {}) };

      const changed: string[] = [];

      // Site/template-level colors, typography & section variant choices
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
      if (
        args.submitButtonIcon === 'auto' ||
        args.submitButtonIcon === 'whatsapp' ||
        args.submitButtonIcon === 'sparkles' ||
        args.submitButtonIcon === 'calendar' ||
        args.submitButtonIcon === 'none'
      ) {
        nextDesign.submitButtonIcon = args.submitButtonIcon;
        changed.push(`submitIcon=${args.submitButtonIcon}`);
      }
      const submitBtnColor = normalizeSafeHex(args.submitButtonColor);
      if (submitBtnColor) {
        nextDesign.submitButtonColor = submitBtnColor;
        changed.push(`submitColor=${submitBtnColor}`);
      }
      if (typeof args.customCss === 'string') {
        nextDesign.customCss = args.customCss.trim().slice(0, 6000);
        changed.push(nextDesign.customCss ? 'customCss' : 'cleared customCss');
      }
      if (args.fontMood === 'editorial_serif' || args.fontMood === 'modern_sans' || args.fontMood === 'bold_display') {
        nextDesign.fontMood = args.fontMood;
        changed.push(`font=${args.fontMood}`);
      }
      if (args.servicesLayout === 'editorial_list' || args.servicesLayout === 'card_grid' || args.servicesLayout === 'compact_menu') {
        nextDesign.servicesLayout = args.servicesLayout;
        changed.push(`servicesLayout=${args.servicesLayout}`);
      }

      // Breakpoint-isolatable layout, padding, hero & grid properties (all / mobile / tablet / desktop)
      if (
        args.heroLayout === 'split' ||
        args.heroLayout === 'centered' ||
        args.heroLayout === 'full_bleed' ||
        args.heroLayout === 'minimal_card'
      ) {
        targetSlice.heroLayout = args.heroLayout;
        changed.push(`${scope}:heroLayout=${args.heroLayout}`);
      }
      if (args.heroTextAlign === 'left' || args.heroTextAlign === 'center') {
        targetSlice.heroTextAlign = args.heroTextAlign;
        changed.push(`${scope}:heroAlign=${args.heroTextAlign}`);
      }
      if (typeof args.hideHeroImage === 'boolean') {
        targetSlice.hideHeroImage = args.hideHeroImage;
        changed.push(`${scope}:hideHeroImage=${args.hideHeroImage}`);
      }
      if (args.fontScale === 'compact' || args.fontScale === 'normal' || args.fontScale === 'large') {
        targetSlice.fontScale = args.fontScale;
        changed.push(`${scope}:fontScale=${args.fontScale}`);
      }
      if (args.pagePaddingX === 'compact' || args.pagePaddingX === 'normal' || args.pagePaddingX === 'spacious') {
        targetSlice.pagePaddingX = args.pagePaddingX;
        changed.push(`${scope}:paddingX=${args.pagePaddingX}`);
      }
      if (args.sectionSpacing === 'compact' || args.sectionSpacing === 'normal' || args.sectionSpacing === 'airy') {
        targetSlice.sectionSpacing = args.sectionSpacing;
        changed.push(`${scope}:spacing=${args.sectionSpacing}`);
      }
      if (
        args.heroImageAspect === 'auto' ||
        args.heroImageAspect === 'square' ||
        args.heroImageAspect === 'landscape' ||
        args.heroImageAspect === 'portrait' ||
        args.heroImageAspect === 'wide'
      ) {
        targetSlice.heroImageAspect = args.heroImageAspect;
        changed.push(`${scope}:heroAspect=${args.heroImageAspect}`);
      }
      if (typeof args.heroImageMaxHeight === 'number' && !Number.isNaN(args.heroImageMaxHeight)) {
        const clamped = Math.min(680, Math.max(140, Math.round(args.heroImageMaxHeight)));
        targetSlice.heroImageMaxHeight = clamped;
        changed.push(`${scope}:heroMaxH=${clamped}px`);
      }
      if (
        args.heroImageShape === 'arch' ||
        args.heroImageShape === 'rounded' ||
        args.heroImageShape === 'card' ||
        args.heroImageShape === 'circle'
      ) {
        targetSlice.heroImageShape = args.heroImageShape;
        changed.push(`${scope}:heroShape=${args.heroImageShape}`);
      }
      if (args.heroImageFit === 'cover' || args.heroImageFit === 'contain') {
        targetSlice.heroImageFit = args.heroImageFit;
        changed.push(`${scope}:heroFit=${args.heroImageFit}`);
      }
      if (typeof args.galleryColumns === 'number' && !Number.isNaN(args.galleryColumns)) {
        const cols = Math.min(4, Math.max(1, Math.round(args.galleryColumns)));
        targetSlice.galleryColumns = cols;
        changed.push(`${scope}:galleryCols=${cols}`);
      }
      if (typeof args.servicesColumns === 'number' && !Number.isNaN(args.servicesColumns)) {
        const cols = Math.min(3, Math.max(1, Math.round(args.servicesColumns)));
        targetSlice.servicesColumns = cols;
        changed.push(`${scope}:servicesCols=${cols}`);
      }

      if (scope !== 'all') {
        nextDesign.responsive = {
          ...(nextDesign.responsive || {}),
          [scope]: targetSlice,
        };
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
            ? `Customized ${TEMPLATE_ENGINES[activeTpl].name} (${changed.join(', ')})`
            : 'No valid design or layout tokens specified',
        ...(changed.length === 0
          ? { error: 'Pass colors, heroLayout, servicesLayout, device overrides, spacing, or heroImage* parameters.' }
          : {}),
        data: { templateId: activeTpl, device: scope, designOverrides: nextDesign },
      };
    }

    case 'reorder_sections': {
      const activeTpl = resolveTemplateEngineId(bp.templateId);
      const validKeys = ['hero', 'services', 'portfolio', 'custom', 'testimonials', 'faq', 'booking'];
      const rawOrder = Array.isArray(args.order) ? args.order : [];
      const cleaned = Array.from(
        new Set(
          rawOrder
            .map((k: any) => String(k || '').trim().toLowerCase())
            .filter((k: string) => validKeys.includes(k))
        )
      );
      if (cleaned.length === 0) {
        return {
          ok: false,
          blueprint: bp,
          changeSummary: 'Invalid section order',
          error: `Provide an order array using: ${validKeys.join(', ')}`,
        };
      }
      const scopedMap: Record<string, TemplateDesignOverrides> = { ...(bp.templateDesignOverrides || {}) };
      const nextDesign: TemplateDesignOverrides = {
        ...(scopedMap[activeTpl] || bp.designOverrides || {}),
        sectionOrder: cleaned,
      };
      scopedMap[activeTpl] = nextDesign;
      bp.templateDesignOverrides = scopedMap;
      bp.designOverrides = nextDesign;
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Reordered sections: ${cleaned.join(' → ')}`,
        data: { templateId: activeTpl, sectionOrder: cleaned },
      };
    }

    case 'upsert_custom_section': {
      const title = String(args.title || '').trim().slice(0, 100);
      const list = bp.customSections || [];
      if (args.remove) {
        const next = list.filter(
          (s) => !(args.id && s.id === args.id) && !(title && s.title.toLowerCase() === title.toLowerCase())
        );
        bp.customSections = next;
        bp.updatedAt = new Date().toISOString();
        return {
          ok: next.length < list.length,
          blueprint: bp,
          changeSummary: next.length < list.length ? 'Removed custom section' : 'Custom section not found',
          ...(next.length === list.length ? { error: 'No matching custom section found.' } : {}),
        };
      }
      if (!title) {
        return { ok: false, blueprint: bp, changeSummary: 'Missing section title', error: 'title is required.' };
      }
      const validLayouts = ['cards', 'checklist', 'hours_info', 'banner_cta', 'custom_html'] as const;
      const layout = validLayouts.includes(args.layout) ? args.layout : 'cards';
      const parsedItems: Array<{ label: string; detail: string }> = Array.isArray(args.items)
        ? args.items
            .map((it: any) => {
              if (typeof it === 'string') {
                const [l, ...rest] = it.split(':');
                return { label: (l || '').trim().slice(0, 80), detail: rest.join(':').trim().slice(0, 220) };
              }
              return {
                label: String(it?.label || '').trim().slice(0, 80),
                detail: String(it?.detail || '').trim().slice(0, 220),
              };
            })
            .filter((it: { label: string; detail: string }) => Boolean(it.label || it.detail))
            .slice(0, 10)
        : [];

      const idx = list.findIndex(
        (s) => (args.id && s.id === args.id) || s.title.toLowerCase() === title.toLowerCase()
      );
      const entry = {
        id: idx >= 0 ? list[idx].id : `sec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title,
        ...(typeof args.eyebrow === 'string' && args.eyebrow.trim() ? { eyebrow: args.eyebrow.trim().slice(0, 40) } : {}),
        ...(typeof args.subtitle === 'string' && args.subtitle.trim() ? { subtitle: args.subtitle.trim().slice(0, 260) } : {}),
        layout,
        items: parsedItems,
        ...(typeof args.ctaText === 'string' && args.ctaText.trim() ? { ctaText: args.ctaText.trim().slice(0, 50) } : {}),
        ...(typeof args.ctaHref === 'string' && args.ctaHref.trim() ? { ctaHref: args.ctaHref.trim().slice(0, 120) } : {}),
        ...(typeof args.html === 'string' && args.html.trim() ? { html: args.html.trim().slice(0, 12000) } : {}),
      };
      if (idx >= 0) {
        list[idx] = entry;
        bp.customSections = list;
      } else {
        bp.customSections = [...list, entry];
      }
      bp.sectionVisibility = { ...(bp.sectionVisibility || {}), custom: true };
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `${idx >= 0 ? 'Updated' : 'Added'} custom section "${title}" (${layout})`,
        data: { section: entry },
      };
    }

    case 'inject_slot': {
      const slot = typeof args.slot === 'string' ? args.slot.trim() : '';
      if (!(BLUEPRINT_INJECTION_SLOTS as readonly string[]).includes(slot)) {
        return {
          ok: false,
          blueprint: bp,
          changeSummary: `Invalid injection slot "${slot}". Allowed: ${BLUEPRINT_INJECTION_SLOTS.join(', ')}`,
        };
      }
      const typedSlot = slot as BlueprintSlotId;
      const nextInjections: Partial<Record<BlueprintSlotId, string>> = { ...(bp.injections || {}) };

      if (args.clear === true) {
        delete nextInjections[typedSlot];
        bp.injections = nextInjections;
        bp.updatedAt = new Date().toISOString();
        return {
          ok: true,
          blueprint: bp,
          changeSummary: `Cleared injection slot "${typedSlot}"`,
          data: { slot: typedSlot, activeInjections: Object.keys(nextInjections) },
        };
      }

      const rawHtml = typeof args.html === 'string' ? args.html.trim().slice(0, 12000) : '';
      const rawCss = typeof args.css === 'string' ? args.css.trim().slice(0, 4000) : '';
      if (!rawHtml && !rawCss) {
        return {
          ok: false,
          blueprint: bp,
          changeSummary: 'Provide sanitized HTML (`html`), CSS (`css`), or `clear: true`.',
        };
      }

      if (rawHtml) {
        nextInjections[typedSlot] = rawHtml;
        bp.injections = nextInjections;
      }

      if (rawCss) {
        const activeTpl = bp.templateId || 'editorial-atelier';
        const prevGlobalCss = bp.designOverrides?.customCss || '';
        const nextGlobalCss = [prevGlobalCss, rawCss].filter(Boolean).join('\n').slice(0, 6000);
        bp.designOverrides = { ...(bp.designOverrides || {}), customCss: nextGlobalCss };

        const prevTplOverrides = bp.templateDesignOverrides?.[activeTpl] || {};
        const prevTplCss = prevTplOverrides.customCss || '';
        const nextTplCss = [prevTplCss, rawCss].filter(Boolean).join('\n').slice(0, 6000);
        bp.templateDesignOverrides = {
          ...(bp.templateDesignOverrides || {}),
          [activeTpl]: { ...prevTplOverrides, customCss: nextTplCss },
        };
      }

      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Injected content into immutable slot "${typedSlot}"`,
        data: {
          slot: typedSlot,
          activeInjections: Object.keys(nextInjections),
          cssApplied: Boolean(rawCss),
        },
      };
    }

    case 'configure_seo': {
      const ALLOWED_SCHEMA_TYPES = [
        'LocalBusiness',
        'BeautySalon',
        'PhotographyBusiness',
        'EventVenue',
        'Bakery',
        'ProfessionalService',
      ] as const;
      type SeoConfig = NonNullable<BusinessBlueprint['seo']>;
      const prevSeo: SeoConfig = { ...(bp.seo || {}) };
      const nextSeo: SeoConfig = { ...prevSeo };

      if (typeof args.metaTitle === 'string') {
        const val = args.metaTitle.trim().slice(0, 120);
        if (val) nextSeo.metaTitle = val;
        else delete nextSeo.metaTitle;
      }
      if (typeof args.metaDescription === 'string') {
        const val = args.metaDescription.trim().slice(0, 320);
        if (val) nextSeo.metaDescription = val;
        else delete nextSeo.metaDescription;
      }
      if (Array.isArray(args.keywords)) {
        const cleanKeywords = args.keywords
          .filter((k: unknown): k is string => typeof k === 'string' && k.trim().length > 0)
          .map((k: string) => k.trim().slice(0, 60))
          .slice(0, 15);
        nextSeo.keywords = cleanKeywords;
      }
      if (typeof args.canonicalUrl === 'string') {
        const val = args.canonicalUrl.trim().slice(0, 300);
        if (/^https?:\/\//i.test(val)) nextSeo.canonicalUrl = val;
        else if (!val) delete nextSeo.canonicalUrl;
      }
      if (typeof args.ogImageUrl === 'string') {
        const val = args.ogImageUrl.trim().slice(0, 300);
        if (/^https?:\/\//i.test(val)) nextSeo.ogImageUrl = val;
        else if (!val) delete nextSeo.ogImageUrl;
      }
      if (typeof args.noIndex === 'boolean') {
        nextSeo.noIndex = args.noIndex;
      }
      if (typeof args.schemaType === 'string') {
        const candidate = args.schemaType.trim();
        if ((ALLOWED_SCHEMA_TYPES as readonly string[]).includes(candidate)) {
          nextSeo.schemaType = candidate as (typeof ALLOWED_SCHEMA_TYPES)[number];
        }
      }
      if (typeof args.priceRange === 'string') {
        const val = args.priceRange.trim().slice(0, 20);
        if (val) nextSeo.priceRange = val;
        else delete nextSeo.priceRange;
      }
      if (typeof args.openingHours === 'string') {
        const val = args.openingHours.trim().slice(0, 100);
        if (val) nextSeo.openingHours = val;
        else delete nextSeo.openingHours;
      }
      if (typeof args.areaServed === 'string') {
        const val = args.areaServed.trim().slice(0, 120);
        if (val) nextSeo.areaServed = val;
        else delete nextSeo.areaServed;
      }

      bp.seo = nextSeo;
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: 'Updated SEO metadata & Schema.org configuration',
        data: { seo: nextSeo },
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

      const resolveServiceImageArg = (): { provided: boolean; url?: string; isVideo?: boolean } => {
        if (typeof args.mediaAssetId === 'string' && args.mediaAssetId.trim()) {
          const found = (bp.mediaVault || []).find((m) => m.id === args.mediaAssetId.trim());
          const src = getAssetRenderSource(found);
          if (found && src) {
            return { provided: true, url: src, isVideo: resolveAssetMediaKind(found) === 'video' };
          }
        }
        if (typeof args.photoNumber === 'number' && !Number.isNaN(args.photoNumber)) {
          const vault = (bp.mediaVault || []).filter((m) => Boolean(getAssetRenderSource(m)));
          const asset = vault[Math.max(0, Math.round(args.photoNumber) - 1)];
          const src = getAssetRenderSource(asset);
          if (asset && src) {
            return { provided: true, url: src, isVideo: resolveAssetMediaKind(asset) === 'video' };
          }
        }
        if (typeof args.imageUrl === 'string') {
          const trimmed = args.imageUrl.trim();
          if (!trimmed) return { provided: true, url: undefined };
          if (/^(https?:\/\/|data:(?:image|video)\/|\/api\/media\/ig\b)/i.test(trimmed)) {
            return { provided: true, url: trimmed.slice(0, 600000), isVideo: isVideoMediaUrl(trimmed) };
          }
        }
        return { provided: false };
      };
      const resolvedImg = resolveServiceImageArg();
      const mediaNote = resolvedImg.provided
        ? resolvedImg.url
          ? resolvedImg.isVideo
            ? ' (with video)'
            : ' (with photo)'
          : ' (removed media)'
        : '';

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
          ...(resolvedImg.provided ? { imageUrl: resolvedImg.url } : {}),
        };
        bp.modules.services.items = items;
        bp.updatedAt = new Date().toISOString();
        return {
          ok: true,
          blueprint: bp,
          changeSummary: `Updated service "${cleanName}"${mediaNote}`,
          data: { service: items[existingIdx] },
        };
      }

      const created = {
        id: `srv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        price: numericPrice,
        priceMode: finalMode,
        durationMinutes: typeof args.durationMinutes === 'number' ? args.durationMinutes : 60,
        locationType: 'in_studio' as const,
        description: typeof args.description === 'string' ? args.description.trim().slice(0, 220) : '',
        tag: typeof args.tag === 'string' ? args.tag.trim().toUpperCase().slice(0, 20) : 'SIGNATURE',
        ...(resolvedImg.provided && resolvedImg.url ? { imageUrl: resolvedImg.url } : {}),
        enabled: true,
      };
      bp.modules.services.items = [...items, created];
      bp.updatedAt = new Date().toISOString();
      const sym = SUPPORTED_CURRENCIES[bp.profile.currency || 'NGN']?.symbol || '₦';
      const priceStr = finalMode === 'quote' ? 'Custom Quote' : `${finalMode === 'starting_at' ? 'From ' : ''}${sym}${numericPrice.toLocaleString('en-US')}`;
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Added service "${cleanName}" (${priceStr})${resolvedImg.provided && resolvedImg.url ? mediaNote : ''}`,
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
        id: `prd-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
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
      const mediaKind = resolveAssetMediaKind(vault[targetIdx]);
      const picked = { ...vault[targetIdx], type: 'hero' as const, mediaKind };
      const rest = vault
        .filter((_, i) => i !== targetIdx)
        .map((m) =>
          m.type === 'hero'
            ? { ...m, type: (resolveAssetMediaKind(m) === 'video' ? 'video' : 'gallery') as 'video' | 'gallery' }
            : m
        );
      bp.mediaVault = [picked, ...rest];
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Promoted "${picked.name}" to Hero Cover ${mediaKind}`,
        data: {
          heroAssetId: picked.id,
          heroName: picked.name,
          heroMediaKind: mediaKind,
          hasPoster: mediaKind === 'video' ? Boolean(getAssetPosterUrl(picked)) : false,
        },
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
