import type { EditorService } from './EditorService';
import type { SaveState } from './EditorContext';
import type { ThemeName } from '@/core/project-schema';
import { renderTemplateEngine } from '@/core/template-engines';
import {
  clearOnboardingDraftMedia,
  loadOnboardingDraftMedia,
  mergeOnboardingMediaVault,
} from '@/lib/onboarding-media-draft';
import { reconcileLocalAndCloudBlueprints } from './blueprint-persistence';

export interface StudioHydrationCallbacks {
  projectId: string;
  userIdRef: { current: string };
  businessNameRef: { current: string };
  themeRef: { current: ThemeName };
  isHeadless: boolean;
  setService: (s: EditorService | null) => void;
  setSaveState: (s: SaveState) => void;
  setCanUndo: (v: boolean) => void;
  setCanRedo: (v: boolean) => void;
  setBusinessName: (n: string) => void;
  setTheme: (t: ThemeName) => void;
  setIsHydratingSite: (v: boolean) => void;
  onFinishLoading?: () => void;
}

/**
 * Shared SWR hydration + debounced persistence coordinator used by both
 * MobileStudioRuntime (0ms headless, no GrapesJS) and Desktop Canvas (GrapesJS).
 */
export function attachStudioRuntime(
  service: EditorService,
  cb: StudioHydrationCallbacks
): () => void {
  const {
    projectId,
    userIdRef,
    businessNameRef,
    themeRef,
    isHeadless,
    setService,
    setSaveState,
    setCanUndo,
    setCanRedo,
    setBusinessName,
    setTheme,
    setIsHydratingSite,
    onFinishLoading,
  } = cb;

  let localSaveTimer: ReturnType<typeof setTimeout> | undefined;
  let cloudSaveTimer: ReturnType<typeof setTimeout> | undefined;
  let hasPendingLocalWrite = false;
  let hasPendingCloudSync = false;
  let destroyed = false;

  const flushPendingAutosave = () => {
    if (localSaveTimer) {
      clearTimeout(localSaveTimer);
      localSaveTimer = undefined;
    }
    if (cloudSaveTimer) {
      clearTimeout(cloudSaveTimer);
      cloudSaveTimer = undefined;
    }
    if (hasPendingLocalWrite) {
      hasPendingLocalWrite = false;
      service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
    }
    if (hasPendingCloudSync) {
      hasPendingCloudSync = false;
      void service.saveToDatabase(projectId, {
        businessName: businessNameRef.current,
        theme: themeRef.current,
      });
    }
  };

  const handleVisibilityFlush = () => {
    if (document.visibilityState === 'hidden') {
      flushPendingAutosave();
    }
  };

  window.addEventListener('pagehide', flushPendingAutosave);
  document.addEventListener('visibilitychange', handleVisibilityFlush);

  const unsubChange = service.onChanged(() => {
    if (destroyed) return;
    setSaveState('unsaved');
    setCanUndo(service.canUndo());
    setCanRedo(service.canRedo());

    hasPendingLocalWrite = true;
    hasPendingCloudSync = true;

    if (localSaveTimer) clearTimeout(localSaveTimer);
    localSaveTimer = setTimeout(() => {
      if (destroyed || !hasPendingLocalWrite) return;
      hasPendingLocalWrite = false;
      service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
    }, 180);

    if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(async () => {
      if (destroyed || !hasPendingCloudSync) return;
      hasPendingCloudSync = false;
      if (hasPendingLocalWrite) {
        hasPendingLocalWrite = false;
        service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
      }
      const ok = await service.saveToDatabase(projectId, {
        businessName: businessNameRef.current,
        theme: themeRef.current,
      });
      if (!destroyed) {
        setSaveState(ok ? 'saved' : 'error');
      }
    }, 650);
  });

  // 1. Instant 0ms SWR Hydration from LocalStorage
  const localRes = service.loadFromLocalStorage(projectId, userIdRef.current);
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const draftOnboardingMedia = loadOnboardingDraftMedia();
  const hasWarmState =
    (localRes.loaded && !localRes.snapshot?.mediaStrippedForQuota) || draftOnboardingMedia.length > 0;

  if (localRes.loaded) {
    if (localRes.theme) setTheme(localRes.theme as ThemeName);
    if (localRes.name) {
      setBusinessName(localRes.name);
      businessNameRef.current = localRes.name;
    }
    if (!isHeadless) {
      service.sanitizeCanvas();
      service.syncCanvasWithBlueprint();
    }
    if (!localRes.snapshot?.mediaStrippedForQuota) {
      onFinishLoading?.();
      setIsHydratingSite(false);
    }
  } else if (draftOnboardingMedia.length > 0) {
    const urlTpl = urlParams?.get('template') || urlParams?.get('templateId');
    const urlCat = urlParams?.get('category') || urlParams?.get('nicheId');
    if (urlCat) service.switchNiche(urlCat, projectId);
    if (!isHeadless) {
      const rendered = renderTemplateEngine(urlTpl || service.getTemplateId(), service.getBlueprint(), {
        siteId: projectId,
      });
      service.loadHtml(rendered.fullHtml, 'Initial Template', 'initial');
      service.sanitizeCanvas();
    }
    onFinishLoading?.();
    setIsHydratingSite(false);
  }

  // Hydrate gallery photos uploaded during Onboarding Step 2
  if (draftOnboardingMedia.length > 0) {
    const merged = mergeOnboardingMediaVault(draftOnboardingMedia, service.getMediaVault(), 20);
    service.setMediaVault(merged);
    if (!isHeadless) {
      service.injectInstagramMediaToCanvas(merged);
    }
    service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
  }

  // Optional Instagram Media Hydration (only when onboarding cookie / explicit IG sync param is present)
  if (urlParams) {
    const igHandle = urlParams.get('instagram');
    const isSynced = urlParams.get('synced') === 'instagram';

    let cookieMedia: any[] | null = null;
    let cookieHandle: string | null = null;
    try {
      const cookies = document.cookie.split(';');
      const mCookie = cookies.find((c) => c.trim().startsWith('cuzmify_ig_media='));
      if (mCookie) {
        const raw = decodeURIComponent(mCookie.split('=')[1]);
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cookieMedia = parsed;
        }
      }
      const hCookie = cookies.find((c) => c.trim().startsWith('cuzmify_ig_handle='));
      if (hCookie) {
        cookieHandle = decodeURIComponent(hCookie.split('=')[1]);
      }
    } catch {}

    if (cookieMedia && cookieMedia.length > 0) {
      const mergedCookie = mergeOnboardingMediaVault(draftOnboardingMedia, cookieMedia, 20);
      service.setMediaVault(mergedCookie);
      if (!isHeadless) {
        service.injectInstagramMediaToCanvas(mergedCookie);
      }
      const activeHandle = cookieHandle || igHandle;
      if (activeHandle) {
        service.updateProfile({ instagram: activeHandle, instagramHandle: activeHandle });
      }
    } else if (igHandle || isSynced) {
      const targetHandle = igHandle || service.getBlueprint()?.profile?.instagram;
      if (targetHandle) {
        fetch('/api/auth/instagram/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handle: targetHandle }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (!destroyed && data?.mediaVault && data.mediaVault.length > 0) {
              const mergedSync = mergeOnboardingMediaVault(draftOnboardingMedia, data.mediaVault, 20);
              service.setMediaVault(mergedSync);
              if (!isHeadless) {
                service.injectInstagramMediaToCanvas(mergedSync);
              }
              service.updateProfile({ instagram: targetHandle, instagramHandle: targetHandle });
            }
          })
          .catch(() => {});
      }
    }
  }

  // Expose service right away when warm so controls respond on frame 1
  if (hasWarmState) {
    setService(service);
  }

  // 2. Background Cloud Database Sync (timestamp-aware)
  service
    .loadFromDatabase(projectId, { allowFallback: draftOnboardingMedia.length === 0 })
    .then(async (cloudRes) => {
      if (destroyed) return;

      if (cloudRes.loaded) {
        const reconciled = reconcileLocalAndCloudBlueprints({
          localSnapshot: localRes.snapshot || null,
          cloudBlueprint: cloudRes.blueprint || service.getBlueprint(),
          cloudSiteId: cloudRes.siteId,
        });

        if (reconciled.winner === 'local' && reconciled.blueprint) {
          service.applyExternalBlueprint(reconciled.blueprint, cloudRes.siteId || projectId);
          if (reconciled.blueprint.profile?.name) {
            setBusinessName(reconciled.blueprint.profile.name);
            businessNameRef.current = reconciled.blueprint.profile.name;
          }
          service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
          if (reconciled.needsCloudResync) {
            const resynced = await service.saveToDatabase(cloudRes.siteId || projectId, {
              businessName: businessNameRef.current,
              theme: themeRef.current,
            });
            if (!destroyed) setSaveState(resynced ? 'saved' : 'error');
          }
        } else {
          if (cloudRes.theme) setTheme(cloudRes.theme as ThemeName);
          if (cloudRes.name) {
            setBusinessName(cloudRes.name);
            businessNameRef.current = cloudRes.name;
          }
          if (draftOnboardingMedia.length > 0) {
            const mergedCloud = mergeOnboardingMediaVault(draftOnboardingMedia, service.getMediaVault(), 20);
            service.setMediaVault(mergedCloud);
          }
          if (!isHeadless) {
            service.sanitizeCanvas();
            service.syncCanvasWithBlueprint();
          }
          // Cache latest cloud blueprint locally without triggering spurious 'unsaved' state
          const localSavedAt = localRes.snapshot?.blueprint?.updatedAt || '';
          const cloudSavedAt = cloudRes.blueprint?.updatedAt || '';
          if (cloudSavedAt !== localSavedAt || !localRes.loaded) {
            service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
          }
          setSaveState('saved');
        }
      } else if (!hasWarmState && !localRes.loaded) {
        const urlTpl = urlParams?.get('template') || urlParams?.get('templateId');
        const urlCat = urlParams?.get('category') || urlParams?.get('nicheId');
        if (urlCat) service.switchNiche(urlCat, projectId);
        if (!isHeadless) {
          const rendered = renderTemplateEngine(urlTpl || service.getTemplateId(), service.getBlueprint(), {
            siteId: projectId,
          });
          service.loadHtml(rendered.fullHtml, 'Initial Template', 'initial');
          service.sanitizeCanvas();
        }
      } else if (localRes.loaded) {
        const pushed = await service.saveToDatabase(projectId, {
          businessName: businessNameRef.current,
          theme: themeRef.current,
        });
        if (!destroyed) setSaveState(pushed ? 'saved' : 'error');
      }

      if (draftOnboardingMedia.length > 0) {
        service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
        const saved = await service.saveToDatabase(projectId, {
          businessName: businessNameRef.current,
          theme: themeRef.current,
        });
        if (saved) {
          clearOnboardingDraftMedia();
        }
      }

      if (!hasWarmState) {
        setService(service);
      }
      onFinishLoading?.();
      setIsHydratingSite(false);
    });

  return () => {
    destroyed = true;
    if (localSaveTimer) clearTimeout(localSaveTimer);
    if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
    window.removeEventListener('pagehide', flushPendingAutosave);
    document.removeEventListener('visibilitychange', handleVisibilityFlush);
    unsubChange();
    service.destroy();
  };
}
