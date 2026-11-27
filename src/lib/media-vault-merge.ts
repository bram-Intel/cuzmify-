import type { MediaVaultAsset } from '@/core/blueprint-schema';

/**
 * Merges incoming Instagram sync assets with any existing manually uploaded / custom
 * vault media so Instagram refreshes NEVER erase owner-uploaded photos.
 *
 * Rules:
 * - Preserves all non-Instagram, non-template assets (e.g. phone/studio uploads, URLs, custom service shots) in their existing order.
 * - Replaces/refreshes stale `instagram` / `template` items with the freshly synced `instagramAssets` (deduplicated by `id` / `igMediaId`).
 * - Never slices off owner-uploaded assets even when Instagram returns 20+ posts.
 * - Keeps an existing uploaded `'hero'` cover intact when already present; otherwise ensures index 0 acts as `'hero'`.
 */
export function mergeInstagramMediaIntoVault(
  existingVault: MediaVaultAsset[] | undefined | null,
  instagramAssets: MediaVaultAsset[] | undefined | null,
  maxItems = 24
): MediaVaultAsset[] {
  const existing = Array.isArray(existingVault) ? existingVault : [];
  const incomingIg = Array.isArray(instagramAssets) ? instagramAssets : [];

  // Preserve every manually uploaded or custom-added asset
  const preservedCustom = existing.filter(
    (m) => m && m.source !== 'instagram' && m.source !== 'template'
  );

  // Deduplicate incoming Instagram assets against preserved custom items and themselves
  const seenKeys = new Set<string>();
  const recordKey = (m: MediaVaultAsset) => {
    if (m.id) seenKeys.add(`id:${m.id}`);
    if (m.igMediaId) seenKeys.add(`ig:${m.igMediaId}`);
  };
  preservedCustom.forEach(recordKey);

  const dedupedIg: MediaVaultAsset[] = [];
  for (const item of incomingIg) {
    if (!item) continue;
    const hasId = item.id && seenKeys.has(`id:${item.id}`);
    const hasIg = item.igMediaId && seenKeys.has(`ig:${item.igMediaId}`);
    if (hasId || hasIg) continue;
    recordKey(item);
    dedupedIg.push(item);
  }

  // Always retain ALL manual uploads even if preservedCustom.length >= maxItems
  const remainingSlots = Math.max(0, maxItems - preservedCustom.length);
  const combined = [...preservedCustom, ...dedupedIg.slice(0, remainingSlots)];

  const hasCustomHero = preservedCustom.some((m) => m.type === 'hero');
  return combined.map((item, idx) => {
    if (hasCustomHero) {
      if (item.source === 'instagram' && item.type === 'hero') {
        return { ...item, type: 'gallery' };
      }
      return item;
    }
    return {
      ...item,
      type: idx === 0 ? 'hero' : item.type === 'hero' ? 'gallery' : item.type,
    };
  });
}
