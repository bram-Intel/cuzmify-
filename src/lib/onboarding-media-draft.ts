import type { MediaVaultAsset } from '@/core/blueprint-schema';

const DRAFT_MEDIA_KEY = 'cuzmify_onboarding_draft_media';

function writeStorageSafe(storage: Storage | undefined, key: string, assets: MediaVaultAsset[]): void {
  if (!storage) return;
  if (!assets || assets.length === 0) {
    try {
      storage.removeItem(key);
    } catch {}
    return;
  }

  // Try progressively smaller slices if storage quota is tight on mobile browsers
  const limits = [assets.length, 6, 4, 2, 1];
  for (const count of limits) {
    const slice = assets.slice(0, Math.min(count, assets.length));
    try {
      storage.setItem(key, JSON.stringify(slice));
      return;
    } catch {
      // Continue trying a smaller slice
    }
  }
}

export function saveOnboardingDraftMedia(assets: MediaVaultAsset[]): void {
  if (typeof window === 'undefined') return;
  const bounded = (assets || []).slice(0, 12);
  writeStorageSafe(window.localStorage, DRAFT_MEDIA_KEY, bounded);
  writeStorageSafe(window.sessionStorage, DRAFT_MEDIA_KEY, bounded);
}

export function loadOnboardingDraftMedia(): MediaVaultAsset[] {
  if (typeof window === 'undefined') return [];
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = storage.getItem(DRAFT_MEDIA_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return [];
}

export function clearOnboardingDraftMedia(): void {
  if (typeof window === 'undefined') return;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      storage.removeItem(DRAFT_MEDIA_KEY);
    } catch {}
  }
}

/**
 * Merges newly uploaded onboarding photos cleanly ahead of any existing vault assets without duplicating IDs.
 */
export function mergeOnboardingMediaVault(
  draftAssets: MediaVaultAsset[],
  existingVault: MediaVaultAsset[],
  maxItems = 20
): MediaVaultAsset[] {
  if (!draftAssets || draftAssets.length === 0) return existingVault || [];
  const merged = [
    ...draftAssets,
    ...(existingVault || []).filter((ex) => !draftAssets.some((d) => d.id === ex.id)),
  ].slice(0, maxItems);
  return merged.map((item, idx) => ({
    ...item,
    type: idx === 0 ? 'hero' : item.type === 'hero' ? 'gallery' : item.type,
  }));
}
