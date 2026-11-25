import { SchemaType, type FunctionDeclaration } from '@google/generative-ai';
import {
  SUPPORTED_CURRENCIES,
  type BusinessBlueprint,
  type CurrencyCode,
  type ServicePriceMode,
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
      'Read the current website profile, niche, active design template, services, media assets count, WhatsApp number, and publish URL.',
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
      'Update business profile info or hero copy (business name, tagline/headline, bio/subheadline, city, country, currency, email) without inventing unrequested prices.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        name: { type: 'string', description: 'Business / studio name.' },
        headline: { type: 'string', description: 'Hero headline text shown at the top of the website.' },
        bio: { type: 'string', description: 'About / hero subheadline description.' },
        city: { type: 'string', description: 'City or service area (e.g. Lagos, Abuja, London).' },
        country: { type: 'string', description: 'Country name.' },
        currency: {
          type: 'string',
          description: '3-letter currency code.',
          enum: ['NGN', 'USD', 'GBP', 'EUR', 'KES', 'ZAR', 'CAD', 'AED', 'GHS'],
        },
        email: { type: 'string', description: 'Public business contact email.' },
      },
    },
  },
  {
    name: 'upsert_service_package',
    description:
      'Add a new service package or update an existing service by name/id. Supports fixed pricing, starting_at ("From ₦..."), or custom quote.',
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
    name: 'switch_template_style',
    description:
      'Losslessly switch the website visual template engine while preserving 100% of photos, bio, and services.',
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
    description: 'Update the vendor WhatsApp booking phone number or default enquiry message template.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID (external MCP).' },
        phoneNumber: { type: 'string', description: 'WhatsApp number with country code digits (e.g. 2348031234567).' },
        bookingTemplate: { type: 'string', description: 'Optional custom pre-filled WhatsApp enquiry template.' },
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
    description: 'List recent client booking enquiries submitted on the live website.',
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
    description: 'Publish the current website live so clients can visit its public link and submit bookings.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Optional site ID.' },
      },
    },
  },
];

/** Converts MCP JSON schemas into Gemini SDK FunctionDeclaration format. */
export function toGeminiFunctionDeclarations(includeServerOnly = false): FunctionDeclaration[] {
  const excluded = includeServerOnly ? new Set<string>() : new Set(['list_enquiries', 'publish_site']);
  return CUZMIFY_MCP_TOOLS.filter((t) => !excluded.has(t.name)).map((tool) => {
    const props: Record<string, any> = {};
    for (const [k, v] of Object.entries(tool.inputSchema.properties)) {
      if (k === 'siteId') continue; // Studio context supplies active site automatically
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
      return {
        ok: true,
        blueprint: bp,
        changeSummary: 'Read live site blueprint',
        data: {
          name: bp.profile.name,
          nicheId: bp.nicheId,
          templateId: bp.templateId,
          currency: bp.profile.currency,
          city: bp.profile.city,
          whatsapp: bp.modules.whatsapp.phoneNumber,
          servicesCount: bp.modules.services.items.length,
          services: bp.modules.services.items.map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            priceMode: s.priceMode,
          })),
          mediaCount: bp.mediaVault.length,
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

    case 'switch_template_style': {
      const resolved = resolveTemplateEngineId(String(args.templateId || 'editorial-atelier'));
      bp.templateId = resolved;
      bp.updatedAt = new Date().toISOString();
      return {
        ok: true,
        blueprint: bp,
        changeSummary: `Switched template style to ${TEMPLATE_ENGINES[resolved].name}`,
        data: { templateId: resolved, templateName: TEMPLATE_ENGINES[resolved].name },
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
