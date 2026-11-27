'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  EyeOff,
  Smartphone,
  Instagram,
  Scissors,
  Store,
  Globe,
} from 'lucide-react';
import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { BottomBar } from './BottomBar';
import { MobilePreviewPane } from './MobilePreviewPane';
import { MobileStudioRuntime } from './MobileStudioRuntime';
import { PublishModal } from './publish/PublishModal';
import { StudioInfrastructureHub } from './modules/StudioInfrastructureHub';
import { useEditor } from './engine/EditorContext';
import { StudioLoader } from './StudioLoader';

// Canvas must be dynamically imported — GrapesJS requires window/document
const Canvas = dynamic(() => import('./Canvas').then((m) => ({ default: m.Canvas })), {
  ssr: false,
  loading: () => <StudioLoader className="flex-1 h-full" />,
});

function EditorShellInner() {
  const {
    isPreviewMode,
    service,
    businessName,
    projectId,
    isLeftPanelOpen,
    setIsLeftPanelOpen,
    handlePreviewToggle,
    handleSave,
    handleUndo,
    handleRedo,
    saveToast,
    activeModuleModal,
    setActiveModuleModal,
  } = useEditor();
  const [showPublish, setShowPublish] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Track <1024px vs >=1024px so mobile NEVER downloads or boots heavyweight desktop GrapesJS
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const syncViewport = () => {
      setIsDesktopViewport(mq.matches);
      if (!mq.matches) {
        setIsLeftPanelOpen(false);
      }
    };
    syncViewport();
    mq.addEventListener('change', syncViewport);
    return () => mq.removeEventListener('change', syncViewport);
  }, [setIsLeftPanelOpen]);

  // Keyboard shortcuts: Esc (preview), Ctrl/Cmd+S (save), Ctrl/Cmd+Z (undo), Ctrl/Cmd+Y / Cmd+Shift+Z (redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewMode) {
        handlePreviewToggle();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }

      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (!isInput) {
        const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
        const isUndo = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey;
        const isRedo = isMac
          ? (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'z') || (e.metaKey && e.key.toLowerCase() === 'y')
          : (e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z');

        if (isUndo) {
          e.preventDefault();
          handleUndo();
        } else if (isRedo) {
          e.preventDefault();
          handleRedo();
        } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && service) {
          const comp = service.getSelectedComponentType();
          if (comp) {
            e.preventDefault();
            const delta = e.shiftKey ? 10 : 2;
            const currentTop = parseInt(service.getSelectedStyle('margin-top') || '0', 10) || 0;
            const currentLeft = parseInt(service.getSelectedStyle('margin-left') || '0', 10) || 0;

            if (e.key === 'ArrowUp') service.updateSelectedStyle('margin-top', `${currentTop - delta}px`);
            else if (e.key === 'ArrowDown') service.updateSelectedStyle('margin-top', `${currentTop + delta}px`);
            else if (e.key === 'ArrowLeft') service.updateSelectedStyle('margin-left', `${currentLeft - delta}px`);
            else if (e.key === 'ArrowRight') service.updateSelectedStyle('margin-left', `${currentLeft + delta}px`);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode, handlePreviewToggle, handleSave, handleUndo, handleRedo, service]);

  const handlePublish = async (): Promise<string> => {
    setIsPublishing(true);
    const cleanSubdomain = (businessName || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) || 'studio';
    const publicUrl = `/s/${cleanSubdomain}`;

    if (service) {
      service.saveToLocalStorage(projectId);
      const publishedOk = await service.saveToDatabase(projectId, {
        businessName,
        status: 'live',
        subdomain: cleanSubdomain,
        liveUrl: publicUrl,
      });
      if (!publishedOk) {
        setIsPublishing(false);
        throw new Error('Failed to publish website');
      }
      service.saveToLocalStorage(projectId);
    }

    setIsPublishing(false);
    return publicUrl;
  };

  return (
    <div
      data-cuzmify-studio="true"
      className="flex flex-col h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-[#F1F5F9] text-[#0F172A]"
      suppressHydrationWarning
    >
      {/* Top Bar */}
      {!isPreviewMode && !activeModuleModal && !showPublish && (
        <TopBar
          onPublish={() => setShowPublish(true)}
          isPublishing={isPublishing}
          isRightPanelOpen={isRightPanelOpen}
          onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
        />
      )}

      {/* Main Workspace (kept mounted behind full-screen modals so GrapesJS iframe never suspends on display:none) */}
      <div
        aria-hidden={Boolean(activeModuleModal || showPublish)}
        className={`flex flex-1 overflow-hidden min-h-0 relative ${
          activeModuleModal || showPublish ? 'invisible pointer-events-none' : ''
        }`}
      >
        {/* Desktop Left Sidebar (>=1024px) */}
        {!isPreviewMode && isLeftPanelOpen && (
          <div className="hidden lg:flex h-full shrink-0">
            <LeftPanel />
          </div>
        )}

        {/* Mobile Touch-Safe 60fps Owner Studio (<1024px) */}
        <MobilePreviewPane />

        {/* Viewport-Gated Runtime: 0ms Headless Blueprint Runtime on Mobile (<1024px), Full GrapesJS Canvas on Desktop (>=1024px) */}
        {isDesktopViewport ? (
          <div className="hidden lg:flex lg:flex-1 lg:min-w-0 h-full">
            <Canvas />
          </div>
        ) : (
          <MobileStudioRuntime />
        )}

        {/* Desktop Right Design Inspector (>=1024px — always ready for element styling & theme presets) */}
        {!isPreviewMode && isRightPanelOpen && (
          <div className="hidden lg:flex h-full shrink-0">
            <RightPanel />
          </div>
        )}
      </div>

      {/* Floating Exit Preview Pill */}
      {isPreviewMode && !activeModuleModal && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2 rounded-full bg-[#071A24] text-white shadow-2xl border border-white/15 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">Live Preview</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={handlePreviewToggle}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer"
            title="Exit Preview Mode (Esc)"
          >
            <EyeOff className="w-3.5 h-3.5 text-emerald-300" />
            <span>Exit</span>
          </button>
        </div>
      )}

      {/* Floating Toast */}
      {saveToast && (
        <div className="fixed bottom-20 lg:bottom-12 right-4 sm:right-6 z-[100005] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#071A24] text-white shadow-2xl border border-white/15 backdrop-blur-md font-sans text-xs font-semibold max-w-[90vw]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate">{saveToast}</span>
        </div>
      )}

      {/* Desktop Bottom Status Bar (>=1024px) */}
      {!isPreviewMode && !activeModuleModal && !showPublish && (
        <div className="hidden lg:block">
          <BottomBar />
        </div>
      )}

      {/* Mobile Bottom Thumb Dock (<1024px) — Clean 5-Tab Creator Navigation */}
      {!isPreviewMode && !activeModuleModal && !showPublish && (
        <nav className="lg:hidden h-16 bg-white border-t border-slate-200 px-1.5 flex items-center justify-around shrink-0 z-[60] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] select-none">
          <button
            type="button"
            onClick={() => {
              if (activeModuleModal) {
                setActiveModuleModal(null);
              } else {
                handlePreviewToggle();
              }
            }}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[#0D5771] bg-[#0D5771]/8 font-bold transition-all cursor-pointer"
            title="Open full-screen live mobile preview"
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[11px] leading-none">Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModuleModal('media')}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-slate-600 hover:text-[#0D5771] transition-all cursor-pointer"
          >
            <Instagram className="w-4 h-4 text-pink-600" />
            <span className="text-[11px] font-semibold leading-none">IG &amp; Photos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModuleModal('services')}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-slate-600 hover:text-[#0D5771] transition-all cursor-pointer"
          >
            <Scissors className="w-4 h-4 text-amber-600" />
            <span className="text-[11px] font-semibold leading-none">Services</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModuleModal('profile')}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-slate-600 hover:text-[#0D5771] transition-all cursor-pointer"
          >
            <Store className="w-4 h-4 text-[#0D5771]" />
            <span className="text-[11px] font-semibold leading-none">Brand &amp; WA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModuleModal('payments')}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-slate-600 hover:text-[#0D5771] transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-semibold leading-none">Domain</span>
          </button>
        </nav>
      )}

      {/* Full-Screen Studio Infrastructure Hub */}
      {activeModuleModal && (
        <StudioInfrastructureHub
          initialTab={activeModuleModal as any}
          onClose={() => setActiveModuleModal(null)}
        />
      )}

      {/* Publish Modal */}
      {showPublish && (
        <PublishModal
          onClose={() => setShowPublish(false)}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}

export function EditorShell({
  initialBusinessName: _initialBusinessName,
  initialTheme: _initialTheme,
  projectId: _projectId,
}: {
  initialBusinessName: string;
  initialTheme: import('@/core/project-schema').ThemeName;
  projectId: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <StudioLoader className="h-screen w-screen" />;
  }

  return <EditorShellInner />;
}
