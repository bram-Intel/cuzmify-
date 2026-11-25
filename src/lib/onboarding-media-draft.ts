import type { MediaVaultAsset } from '@/core/blueprint-schema';

const DRAFT_MEDIA_KEY = 'cuzmify_onboarding_draft_media';

export function saveOnboardingDraftMedia(assets: MediaVaultAsset[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (!assets || assets.length === 0) {
      localStorage.removeItem(DRAFT_MEDIA_KEY);
      return;
    }
    localStorage.setItem(DRAFT_MEDIA_KEY, JSON.stringify(assets.slice(0, 12)));
  } catch {
    // Retry with fewer assets if localStorage quota is tight
    try {
      localStorage.setItem(DRAFT_MEDIA_KEY, JSON.stringify(assets.slice(0, 5)));
    } catch {}
  }
}

export function loadOnboardingDraftMedia(): MediaVaultAsset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DRAFT_MEDIA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearOnboardingDraftMedia(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_MEDIA_KEY);
  } catch {}
}
