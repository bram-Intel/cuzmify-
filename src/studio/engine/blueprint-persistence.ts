import type { BusinessBlueprint, ServiceItem } from '@/core/blueprint-schema';
import { resolveTemplateEngineId, TEMPLATE_ENGINES } from '@/core/template-engines';

export interface StudioLocalSnapshot {
  version: 2;
  siteId?: string;
  theme?: string;
  businessName?: string;
  blueprint: BusinessBlueprint;
  grapesData?: Record<string, unknown>;
  html?: string;
  css?: string;
  mediaStrippedForQuota?: boolean;
  savedAt: string;
}

const MAX_CUSTOM_GRAPES_CHARS = 600_000;
const KEEPALIVE_MAX_CHARS = 58_000;

export function getStudioStorageKey(projectId: string, userId?: string): string {
  const safeUser = (userId || 'guest').trim() || 'guest';
  const safeProject = (projectId || 'proj_default').trim() || 'proj_default';
  return `cuzmify_project_${safeUser}_${safeProject}`;
}

function stripInlineDataUrlsFromBlueprint(bp: BusinessBlueprint): BusinessBlueprint {
  const strippedVault = (bp.mediaVault || []).filter(
    (m) => typeof m.url === 'string' && !m.url.startsWith('data:')
  );
  const strippedServices: ServiceItem[] = (bp.modules?.services?.items || []).map((srv) =>
    srv.imageUrl && srv.imageUrl.startsWith('data:')
      ? { ...srv, imageUrl: undefined }
      : srv
  );
  return {
    ...bp,
    mediaVault: strippedVault,
    modules: {
      ...bp.modules,
      services: {
        ...bp.modules.services,
        items: strippedServices,
      },
    },
  };
}

export function writeStudioLocalSnapshot(
  storage: Pick<Storage, 'setItem' | 'removeItem' | 'key' | 'length'>,
  params: {
    projectId: string;
    userId?: string;
    siteId?: string;
    theme?: string;
    blueprint: BusinessBlueprint;
    grapesData?: Record<string, unknown>;
    includeGrapesData?: boolean;
  }
): { saved: boolean; mediaStrippedForQuota: boolean } {
  const { projectId, userId, siteId, theme, blueprint, grapesData, includeGrapesData } = params;
  const primaryKey = getStudioStorageKey(projectId, userId);
  const resolvedSiteId = siteId || (projectId && projectId !== 'proj_default' ? projectId : undefined);
  const savedAt = new Date().toISOString();

  let optionalGrapes: Record<string, unknown> | undefined;
  if (includeGrapesData && grapesData) {
    try {
      const serializedGrapes = JSON.stringify(grapesData);
      if (serializedGrapes.length <= MAX_CUSTOM_GRAPES_CHARS) {
        optionalGrapes = grapesData;
      }
    } catch {
      optionalGrapes = undefined;
    }
  }

  const baseSnapshot: StudioLocalSnapshot = {
    version: 2,
    siteId: resolvedSiteId,
    theme,
    businessName: blueprint.profile?.name,
    blueprint,
    ...(optionalGrapes ? { grapesData: optionalGrapes } : {}),
    savedAt,
  };

  const mirrorToConcreteSiteKey = (serialized: string) => {
    if (resolvedSiteId && projectId === 'proj_default') {
      const concreteKey = getStudioStorageKey(resolvedSiteId, userId);
      if (concreteKey !== primaryKey) {
        try {
          storage.setItem(concreteKey, serialized);
        } catch {
          // Best-effort mirror only
        }
      }
    }
  };

  try {
    const serialized = JSON.stringify(baseSnapshot);
    storage.setItem(primaryKey, serialized);
    mirrorToConcreteSiteKey(serialized);
    return { saved: true, mediaStrippedForQuota: false };
  } catch {
    // Quota recovery pass 1: evict stale cuzmify_project_* cache entries for other projects/guests
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith('cuzmify_project_') && k !== primaryKey) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => storage.removeItem(k));

      const withoutGrapes: StudioLocalSnapshot = {
        version: 2,
        siteId: resolvedSiteId,
        theme,
        businessName: blueprint.profile?.name,
        blueprint,
        savedAt,
      };
      const serializedRetry = JSON.stringify(withoutGrapes);
      storage.setItem(primaryKey, serializedRetry);
      mirrorToConcreteSiteKey(serializedRetry);
      return { saved: true, mediaStrippedForQuota: false };
    } catch {
      // Quota recovery pass 2: strip multi-MB inline data: URLs so services, prices, copy & design overrides ALWAYS persist
      try {
        const slimSnapshot: StudioLocalSnapshot = {
          version: 2,
          siteId: resolvedSiteId,
          theme,
          businessName: blueprint.profile?.name,
          blueprint: stripInlineDataUrlsFromBlueprint(blueprint),
          mediaStrippedForQuota: true,
          savedAt,
        };
        const serializedSlim = JSON.stringify(slimSnapshot);
        storage.setItem(primaryKey, serializedSlim);
        mirrorToConcreteSiteKey(serializedSlim);
        return { saved: true, mediaStrippedForQuota: true };
      } catch {
        return { saved: false, mediaStrippedForQuota: false };
      }
    }
  }
}

export function readStudioLocalSnapshot(
  storage: Pick<Storage, 'getItem'>,
  projectId: string,
  userId?: string
): StudioLocalSnapshot | null {
  try {
    const primaryKey = getStudioStorageKey(projectId, userId);
    const raw = storage.getItem(primaryKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.blueprint) return null;
    return {
      version: 2,
      siteId: typeof parsed.siteId === 'string' ? parsed.siteId : undefined,
      theme: typeof parsed.theme === 'string' ? parsed.theme : undefined,
      businessName: typeof parsed.businessName === 'string' ? parsed.businessName : undefined,
      blueprint: parsed.blueprint as BusinessBlueprint,
      grapesData: parsed.grapesData && typeof parsed.grapesData === 'object' ? parsed.grapesData : undefined,
      html: typeof parsed.html === 'string' ? parsed.html : undefined,
      css: typeof parsed.css === 'string' ? parsed.css : undefined,
      mediaStrippedForQuota: Boolean(parsed.mediaStrippedForQuota),
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
    };
  } catch {
    return null;
  }
}

export function buildSlimSaveSitePayload(params: {
  projectId: string;
  resolvedSiteId?: string;
  blueprint: BusinessBlueprint;
  businessName?: string;
  theme?: string;
  template?: string;
  category?: string;
  status?: string;
  subdomain?: string;
  liveUrl?: string;
  includeCustomCanvas?: boolean;
  htmlContent?: string;
  grapesData?: Record<string, unknown>;
}): {
  payload: Record<string, unknown>;
  serialized: string;
  canUseKeepalive: boolean;
} {
  const {
    projectId,
    resolvedSiteId,
    blueprint,
    businessName,
    theme,
    template,
    category,
    status,
    subdomain,
    liveUrl,
    includeCustomCanvas,
    htmlContent,
    grapesData,
  } = params;

  const bpName = blueprint.profile?.name;
  const finalName =
    bpName && bpName !== 'Gmakeup Studio' && bpName !== 'Glory Beauty Studio'
      ? bpName
      : businessName || bpName || 'My Business';

  const tplId = resolveTemplateEngineId(blueprint.templateId);
  const cleanSub =
    subdomain ||
    (finalName || 'studio')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 30) ||
    'studio';

  const effectiveSiteId =
    projectId && projectId !== 'proj_default' ? projectId : resolvedSiteId || projectId;

  const payload: Record<string, unknown> = {
    siteId: effectiveSiteId,
    name: finalName,
    subdomain: cleanSub,
    nicheId: blueprint.nicheId || blueprint.profile?.nicheId,
    templateId: tplId,
    template: template || TEMPLATE_ENGINES[tplId]?.name,
    category: category || blueprint.profile?.category,
    theme,
    blueprintData: blueprint,
    grapesData: includeCustomCanvas && grapesData ? grapesData : null,
    ...(includeCustomCanvas && htmlContent ? { htmlContent } : {}),
    ...(status ? { status } : {}),
    whatsappPhone: blueprint.modules?.whatsapp?.phoneNumber || blueprint.profile?.whatsapp || undefined,
    currency: blueprint.profile?.currency,
    liveUrl: liveUrl || `/s/${cleanSub}`,
  };

  const serialized = JSON.stringify(payload);
  return {
    payload,
    serialized,
    canUseKeepalive: serialized.length <= KEEPALIVE_MAX_CHARS,
  };
}

function parseTimestamp(iso?: string | null): number {
  if (!iso || typeof iso !== 'string') return 0;
  const ts = Date.parse(iso);
  return Number.isFinite(ts) ? ts : 0;
}

export function reconcileLocalAndCloudBlueprints(params: {
  localSnapshot: StudioLocalSnapshot | null;
  cloudBlueprint: BusinessBlueprint | null;
  cloudSiteId?: string;
}): {
  winner: 'local' | 'cloud' | 'none';
  blueprint: BusinessBlueprint | null;
  needsCloudResync: boolean;
} {
  const { localSnapshot, cloudBlueprint, cloudSiteId } = params;

  if (!localSnapshot?.blueprint && !cloudBlueprint) {
    return { winner: 'none', blueprint: null, needsCloudResync: false };
  }
  if (!cloudBlueprint && localSnapshot?.blueprint) {
    return { winner: 'local', blueprint: localSnapshot.blueprint, needsCloudResync: true };
  }
  if (!localSnapshot?.blueprint && cloudBlueprint) {
    return { winner: 'cloud', blueprint: cloudBlueprint, needsCloudResync: false };
  }

  const localBp = localSnapshot!.blueprint;
  const cloudBp = cloudBlueprint!;

  // Only allow local to supersede cloud if it belongs to the same site (or an initial proj_default draft for the same brand)
  const sameSite =
    !localSnapshot!.siteId ||
    !cloudSiteId ||
    localSnapshot!.siteId === cloudSiteId;

  if (!sameSite) {
    return { winner: 'cloud', blueprint: cloudBp, needsCloudResync: false };
  }

  const localTs = Math.max(parseTimestamp(localBp.updatedAt), parseTimestamp(localSnapshot!.savedAt));
  const cloudTs = parseTimestamp(cloudBp.updatedAt);

  if (localTs > cloudTs) {
    // Local has newer edits (e.g. fast reload right after adding a service before network POST finished)
    let mergedLocal = localBp;
    if (localSnapshot!.mediaStrippedForQuota && (cloudBp.mediaVault?.length || 0) > 0) {
      const existingIds = new Set((localBp.mediaVault || []).map((m) => m.id));
      const restoredVault = [
        ...(localBp.mediaVault || []),
        ...(cloudBp.mediaVault || []).filter((m) => !existingIds.has(m.id)),
      ];
      const cloudSrvImages = new Map(
        (cloudBp.modules?.services?.items || [])
          .filter((s) => Boolean(s.imageUrl))
          .map((s) => [s.id, s.imageUrl])
      );
      mergedLocal = {
        ...localBp,
        mediaVault: restoredVault,
        modules: {
          ...localBp.modules,
          services: {
            ...localBp.modules.services,
            items: (localBp.modules?.services?.items || []).map((s) =>
              !s.imageUrl && cloudSrvImages.has(s.id)
                ? { ...s, imageUrl: cloudSrvImages.get(s.id) }
                : s
            ),
          },
        },
      };
    }
    return { winner: 'local', blueprint: mergedLocal, needsCloudResync: true };
  }

  return { winner: 'cloud', blueprint: cloudBp, needsCloudResync: false };
}
