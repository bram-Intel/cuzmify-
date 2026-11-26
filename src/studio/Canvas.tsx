'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEditor } from './engine/EditorContext';
import { EditorService } from './engine/EditorService';
import { Lock } from 'lucide-react';
import { RESPONSIVE_CORE_CSS } from '@/core/responsive-core';
import { renderTemplateEngine } from '@/core/template-engines';
import { clearOnboardingDraftMedia, loadOnboardingDraftMedia, mergeOnboardingMediaVault } from '@/lib/onboarding-media-draft';
import { reconcileLocalAndCloudBlueprints } from './engine/blueprint-persistence';
import { StudioLoader } from './StudioLoader';

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    setService,
    setSaveState,
    setCanUndo,
    setCanRedo,
    setSelectedComponent,
    setActiveModuleModal,
    setIsHydratingSite,
    projectId,
    businessName,
    setBusinessName,
    theme,
    setTheme,
    breakpoint,
  } = useEditor();

  const { data: session } = useSession();
  const currentUserId = session?.user?.id || session?.user?.email || 'guest';

  const cleanupRef = useRef<(() => void) | null>(null);
  const themeRef = useRef(theme);
  const businessNameRef = useRef(businessName);
  const userIdRef = useRef(currentUserId);
  const [isCanvasLoading, setIsCanvasLoading] = useState(true);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    businessNameRef.current = businessName;
  }, [businessName]);

  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  const cleanSlug = (businessName || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28) || 'studio';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const domain = rootDomain ? `${cleanSlug}.${rootDomain}` : `cuzmify.vercel.app/s/${cleanSlug}`;

  const initEditor = useCallback(async () => {
    if (!containerRef.current) return;

    const grapesjs = (await import('grapesjs')).default;

    const editor = grapesjs.init({
      container: containerRef.current,
      fromElement: false,
      height: '100%',
      width: 'auto',
      storageManager: false,
      avoidInlineStyle: false,
      keepUnusedStyles: true,
      panels: { defaults: [] },
      deviceManager: {
        devices: [
          { id: 'desktop', name: 'Desktop', width: '' },
          { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
          { id: 'mobile', name: 'Mobile', width: '390px', widthMedia: '480px' },
        ],
      },
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=DM+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap',
        ],
      },
    });

    // Inject base reset stylesheet and attach keyboard shortcuts into iframe canvas
    editor.on('load', () => {
      const doc = editor.Canvas.getDocument();
      if (doc) {
        let style = doc.getElementById('cuzmify-base-css');
        if (!style) {
          style = doc.createElement('style');
          style.id = 'cuzmify-base-css';
          doc.head.appendChild(style);
        }
        style.innerHTML = RESPONSIVE_CORE_CSS;

        const handleCanvasKey = (e: KeyboardEvent) => {
          const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
          const isUndo = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey;
          const isRedo = (isMac ? (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'z') || (e.metaKey && e.key.toLowerCase() === 'y') : (e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z'));

          if (isUndo) {
            e.preventDefault();
            service.undo();
            return;
          } else if (isRedo) {
            e.preventDefault();
            service.redo();
            return;
          }

          // Keyboard Arrow Nudging when element is selected and not editing inline text
          const activeEl = doc.activeElement as HTMLElement | null;
          const isTyping = activeEl && (activeEl.isContentEditable || activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

          if (!isTyping && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            const selected = editor.getSelected() as any;
            if (selected) {
              e.preventDefault();
              const delta = e.shiftKey ? 10 : 2;
              const currentTop = parseInt(service.getSelectedStyle('margin-top') || '0', 10) || 0;
              const currentLeft = parseInt(service.getSelectedStyle('margin-left') || '0', 10) || 0;

              if (e.key === 'ArrowUp') {
                service.updateSelectedStyle('margin-top', `${currentTop - delta}px`);
              } else if (e.key === 'ArrowDown') {
                service.updateSelectedStyle('margin-top', `${currentTop + delta}px`);
              } else if (e.key === 'ArrowLeft') {
                service.updateSelectedStyle('margin-left', `${currentLeft - delta}px`);
              } else if (e.key === 'ArrowRight') {
                service.updateSelectedStyle('margin-left', `${currentLeft + delta}px`);
              }
            }
          }
        };
        doc.addEventListener('keydown', handleCanvasKey);
      }
    });

    const service = new EditorService(editor, businessNameRef.current);

    // Override legacy GrapesJS asset manager to open Cuzmify's sleek Media Vault
    (editor.Commands as any).add('open-assets', {
      run() {
        setActiveModuleModal('media');
      },
    });

    editor.on('asset:select', (asset: any) => {
      const src = typeof asset === 'string' ? asset : (asset.get?.('src') || asset.src);
      if (src) {
        service.applyImageToSelected(src);
        service.addMediaAsset({
          url: src,
          name: asset.get?.('name') || 'Uploaded Media',
          type: 'gallery',
          source: 'upload',
        });
      }
      editor.Modal?.close();
    });

    editor.on('asset:custom', () => {
      setActiveModuleModal('media');
    });

    // Subscribe to changes early so initial onboarding hydration also persists
    let hasPendingCloudSync = false;
    const flushPendingAutosave = () => {
      const pendingTimer = (globalThis as Record<string, unknown>).__cuzmifyAutoSave as ReturnType<typeof setTimeout> | undefined;
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        (globalThis as Record<string, unknown>).__cuzmifyAutoSave = undefined;
      }
      if (!hasPendingCloudSync) return;
      hasPendingCloudSync = false;
      service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
      void service.saveToDatabase(projectId, {
        businessName: businessNameRef.current,
        theme: themeRef.current,
      });
    };

    const handleVisibilityFlush = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingAutosave();
      }
    };
    window.addEventListener('pagehide', flushPendingAutosave);
    document.addEventListener('visibilitychange', handleVisibilityFlush);

    const unsubChange = service.onChanged(() => {
      setSaveState('unsaved');
      setCanUndo(service.canUndo());
      setCanRedo(service.canRedo());

      // Persist synchronously to localStorage on every mutation so instant mobile pull-to-refresh never loses services or edits
      service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
      hasPendingCloudSync = true;

      clearTimeout((globalThis as Record<string, unknown>).__cuzmifyAutoSave as ReturnType<typeof setTimeout>);
      (globalThis as Record<string, unknown>).__cuzmifyAutoSave = setTimeout(async () => {
        hasPendingCloudSync = false;
        service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
        const ok = await service.saveToDatabase(projectId, {
          businessName: businessNameRef.current,
          theme: themeRef.current,
        });
        if (ok) {
          service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
        }
        setSaveState(ok ? 'saved' : 'error');
      }, 600);
    });

    const unsubSel = service.onSelectionChange((type) => {
      const traits = service.getSelectedComponentTraits();
      setSelectedComponent({ type, traits });
    });

    // 1. Instant 0ms SWR Hydration: Hydrate from LocalStorage if warm; otherwise hold overlay until DB loads (no boilerplate flash!)
    const localRes = service.loadFromLocalStorage(projectId, userIdRef.current);
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const draftOnboardingMedia = loadOnboardingDraftMedia();
    const hasWarmState = (localRes.loaded && !localRes.snapshot?.mediaStrippedForQuota) || draftOnboardingMedia.length > 0;

    if (localRes.loaded) {
      if (localRes.theme) setTheme(localRes.theme as any);
      if (localRes.name) {
        setBusinessName(localRes.name);
        businessNameRef.current = localRes.name;
      }
      service.sanitizeCanvas();
      service.syncCanvasWithBlueprint();
      if (!localRes.snapshot?.mediaStrippedForQuota) {
        setIsCanvasLoading(false);
        setIsHydratingSite(false);
      }
    } else if (draftOnboardingMedia.length > 0) {
      const urlTpl = urlParams?.get('template') || urlParams?.get('templateId');
      const urlCat = urlParams?.get('category') || urlParams?.get('nicheId');
      if (urlCat) service.switchNiche(urlCat, projectId);
      const rendered = renderTemplateEngine(urlTpl || service.getTemplateId(), service.getBlueprint(), { siteId: projectId });
      service.loadHtml(rendered.fullHtml, 'Initial Template', 'initial');
      service.sanitizeCanvas();
      setIsCanvasLoading(false);
      setIsHydratingSite(false);
    }

    // Hydrate gallery photos uploaded during Onboarding Step 2 (survives Google/Email auth redirect)
    if (draftOnboardingMedia.length > 0) {
      const merged = mergeOnboardingMediaVault(draftOnboardingMedia, service.getMediaVault(), 20);
      service.setMediaVault(merged);
      service.injectInstagramMediaToCanvas(merged);
      service.syncCanvasWithBlueprint();
      service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
    }

    // 3. Instagram Media Hydration (Cookie / URL Params / OAuth Returning)
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
        service.injectInstagramMediaToCanvas(mergedCookie);
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
              if (data?.mediaVault && data.mediaVault.length > 0) {
                const mergedSync = mergeOnboardingMediaVault(draftOnboardingMedia, data.mediaVault, 20);
                service.setMediaVault(mergedSync);
                service.injectInstagramMediaToCanvas(mergedSync);
                service.updateProfile({ instagram: targetHandle, instagramHandle: targetHandle });
              }
            })
            .catch(() => {});
        } else {
          service.injectInstagramMediaToCanvas();
        }
      } else {
        service.injectInstagramMediaToCanvas();
      }
    }

    // 2. Background Cloud Database Sync (timestamp-aware so newer local edits are never clobbered by an interrupted save)
    service.loadFromDatabase(projectId, { allowFallback: draftOnboardingMedia.length === 0 }).then(async (cloudRes) => {
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
            setSaveState(resynced ? 'saved' : 'error');
          }
        } else {
          if (cloudRes.theme) setTheme(cloudRes.theme as any);
          if (cloudRes.name) {
            setBusinessName(cloudRes.name);
            businessNameRef.current = cloudRes.name;
          }
          if (draftOnboardingMedia.length > 0) {
            const mergedCloud = mergeOnboardingMediaVault(draftOnboardingMedia, service.getMediaVault(), 20);
            service.setMediaVault(mergedCloud);
          }
          service.sanitizeCanvas();
          service.syncCanvasWithBlueprint();
          const bp = service.getBlueprint();
          if (bp?.mediaVault && bp.mediaVault.length > 0) {
            service.injectInstagramMediaToCanvas(bp.mediaVault);
          }
          service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
        }
      } else if (!hasWarmState && !localRes.loaded) {
        // Cold brand-new session with zero saved DB site: initialize cleanly from URL template/niche once DB check completes
        const urlTpl = urlParams?.get('template') || urlParams?.get('templateId');
        const urlCat = urlParams?.get('category') || urlParams?.get('nicheId');
        if (urlCat) service.switchNiche(urlCat, projectId);
        const rendered = renderTemplateEngine(urlTpl || service.getTemplateId(), service.getBlueprint(), { siteId: projectId });
        service.loadHtml(rendered.fullHtml, 'Initial Template', 'initial');
        service.sanitizeCanvas();
      } else if (localRes.loaded) {
        // Local snapshot existed while DB had no record yet — push warm local state to cloud
        const pushed = await service.saveToDatabase(projectId, {
          businessName: businessNameRef.current,
          theme: themeRef.current,
        });
        setSaveState(pushed ? 'saved' : 'error');
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
      setIsCanvasLoading(false);
      setIsHydratingSite(false);
    });

    if (hasWarmState) {
      setService(service);
    }
    if (typeof window !== 'undefined') {
      (window as any).__cuzmifyService = service;
      (window as any).__cuzmifyEditor = editor;
    }

    cleanupRef.current = () => {
      window.removeEventListener('pagehide', flushPendingAutosave);
      document.removeEventListener('visibilitychange', handleVisibilityFlush);
      unsubChange();
      unsubSel();
      service.destroy();
    };
  }, [projectId, setService, setSaveState, setCanUndo, setCanRedo, setSelectedComponent, setIsHydratingSite, setTheme]);

  useEffect(() => {
    initEditor();
    return () => {
      cleanupRef.current?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  return (
    <div className="relative flex-1 h-full bg-[#F1F5F9] overflow-hidden p-2 sm:p-4 flex flex-col items-center justify-center min-w-0">
      {/* Floating Window Container for Pristine UX */}
      <div className="w-full max-w-[1280px] h-full bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_20px_60px_rgba(13,87,113,0.08)] flex flex-col overflow-hidden transition-all duration-200 relative">
        {/* Browser Top Bar Decorator */}
        <div className="h-8 bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 flex items-center justify-between shrink-0 font-mono text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B]">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>https://{domain}</span>
          </div>

          <div className="text-[#94A3B8] font-bold text-[9px] uppercase tracking-wider hidden sm:block">
            {breakpoint === 'mobile'
              ? '📱 Mobile Viewport (390px)'
              : breakpoint === 'tablet'
              ? '📱 Tablet Viewport (768px)'
              : '🖥️ Interactive Desktop Mode'}
          </div>
        </div>

        {/* Canvas Target */}
        <div className="flex-1 relative overflow-hidden bg-[#FFFFFF]">
          {isCanvasLoading && (
            <StudioLoader className="absolute inset-0 z-40" />
          )}
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
