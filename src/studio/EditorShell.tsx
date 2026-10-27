'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  EyeOff,
  Smartphone,
  Instagram,
  ShoppingBag,
  Scissors,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { BottomBar } from './BottomBar';
import { PublishModal } from './publish/PublishModal';
import { StudioInfrastructureHub } from './modules/StudioInfrastructureHub';
import { useEditor } from './engine/EditorContext';

// Canvas must be dynamically imported — GrapesJS requires window/document
const Canvas = dynamic(() => import('./Canvas').then((m) => ({ default: m.Canvas })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#F1F5F9]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#0D5771] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#64748B] text-xs font-mono">Loading Cuzmify Studio…</p>
      </div>
    </div>
  ),
});

function EditorShellInner() {
  const {
    isPreviewMode,
    service,
    businessName,
    projectId,
    selectedComponent,
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
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  // On mobile phones (<768px), start with LeftPanel closed so the user sees their live Canvas immediately
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsLeftPanelOpen(false);
    }
  }, [setIsLeftPanelOpen]);

  // Keyboard shortcuts: Esc (preview), Ctrl/Cmd+S (save), Ctrl/Cmd+Z (undo), Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z (redo)
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
        const isRedo = (isMac ? (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'z') || (e.metaKey && e.key.toLowerCase() === 'y') : (e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z'));

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewMode, handlePreviewToggle, handleSave, handleUndo, handleRedo, service]);

  const handlePublish = async (): Promise<string> => {
    setIsPublishing(true);
    const cleanSubdomain = (businessName || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '') || 'studio';
    const publicUrl = `/s/${cleanSubdomain}`;

    // Save final state with live status to database and localStorage
    if (service) {
      service.saveToLocalStorage(projectId);
      try {
        await fetch('/api/sites/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: projectId,
            name: businessName,
            subdomain: cleanSubdomain,
            htmlContent: service.getHtml(),
            grapesData: service.getProjectData(),
            blueprintData: service.getBlueprint(),
            status: 'live',
            liveUrl: publicUrl,
          }),
        });
      } catch (err) {
        console.warn('[Publish] Cloud publish error:', err);
      }
    }

    setIsPublishing(false);
    return publicUrl;
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F1F5F9] text-[#1A202C]" suppressHydrationWarning>
      {/* Top Bar */}
      {!isPreviewMode && !activeModuleModal && !showPublish && (
        <TopBar
          onPublish={() => setShowPublish(true)}
          isPublishing={isPublishing}
        />
      )}

      {/* Main 3-column layout */}
      <div className={`flex flex-1 overflow-hidden min-h-0 relative ${activeModuleModal || showPublish ? 'hidden' : ''}`}>
        {/* Left Panel: Static sidebar on Desktop, Slide-over Drawer on Mobile */}
        {!isPreviewMode && isLeftPanelOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[65] md:hidden"
              onClick={() => setIsLeftPanelOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-[70] flex md:static md:z-auto h-full shadow-2xl md:shadow-none">
              <LeftPanel />
            </div>
          </>
        )}

        {/* GrapesJS Canvas — always mounted in memory */}
        <Canvas />

        {/* Right Panel: Automatic on Desktop, On-Demand Drawer on Mobile */}
        {!isPreviewMode && selectedComponent.type && (
          <>
            <div className="hidden md:flex h-full">
              <RightPanel />
            </div>

            {mobileInspectorOpen && (
              <>
                <div
                  className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[65] md:hidden"
                  onClick={() => setMobileInspectorOpen(false)}
                />
                <div className="fixed inset-y-0 right-0 z-[70] flex md:hidden h-full shadow-2xl">
                  <div className="relative flex h-full">
                    <button
                      onClick={() => setMobileInspectorOpen(false)}
                      className="absolute top-3 right-3 z-[80] w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 shadow-xs"
                      title="Close Inspector"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <RightPanel />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Mobile Floating Action Pill when a Canvas element is tapped */}
        {!isPreviewMode && selectedComponent.type && !mobileInspectorOpen && !isLeftPanelOpen && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 md:hidden animate-in slide-in-from-bottom-3">
            <button
              onClick={() => setMobileInspectorOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0D5771] text-white text-xs font-bold shadow-xl border border-white/20"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-300" />
              <span>Edit Selected ({selectedComponent.type})</span>
            </button>
            <button
              onClick={() => setActiveModuleModal('media')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white text-[#0D5771] text-xs font-bold shadow-xl border border-slate-200"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-600" />
              <span>Swap Photo</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Exit Preview Bar */}
      {isPreviewMode && !activeModuleModal && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2 rounded-full bg-[#0D5771] text-white shadow-2xl border border-white/20 backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">Live Preview Mode</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={handlePreviewToggle}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 hover:bg-white/30 text-white text-[11px] font-bold transition-all border border-white/20 cursor-pointer"
            title="Exit Preview Mode (Esc)"
          >
            <EyeOff className="w-3.5 h-3.5 text-emerald-300" />
            <span>Exit Preview</span>
          </button>
        </div>
      )}

      {/* Floating Save Toast */}
      {saveToast && (
        <div className="fixed bottom-20 md:bottom-14 right-4 sm:right-6 z-[100005] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#0D5771] text-white shadow-2xl border border-white/20 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300 font-sans text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Desktop Bottom Status Bar */}
      {!isPreviewMode && !activeModuleModal && !showPublish && (
        <div className="hidden md:block">
          <BottomBar />
        </div>
      )}

      {/* Mobile-First Thumb Navigation Dock (<768px) */}
      {!isPreviewMode && !activeModuleModal && !showPublish && (
        <nav className="md:hidden h-16 bg-white border-t border-slate-200 px-2 flex items-center justify-around shrink-0 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] select-none">
          <button
            onClick={() => {
              setIsLeftPanelOpen(false);
              setMobileInspectorOpen(false);
              setActiveModuleModal(null);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              !isLeftPanelOpen && !activeModuleModal
                ? 'text-[#0D5771] font-extrabold'
                : 'text-slate-500'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="text-[10px]">Canvas</span>
          </button>

          <button
            onClick={() => {
              setIsLeftPanelOpen(false);
              setActiveModuleModal('media');
            }}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-slate-600 hover:text-[#0D5771] transition-all cursor-pointer"
          >
            <Instagram className="w-4 h-4 text-pink-600" />
            <span className="text-[10px] font-bold">IG Vault</span>
          </button>

          <button
            onClick={() => {
              setIsLeftPanelOpen(false);
              setActiveModuleModal('products');
            }}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-slate-600 hover:text-[#0D5771] transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold">Products</span>
          </button>

          <button
            onClick={() => {
              setIsLeftPanelOpen(false);
              setActiveModuleModal('services');
            }}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl text-slate-600 hover:text-[#0D5771] transition-all cursor-pointer"
          >
            <Scissors className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-bold">Services</span>
          </button>

          <button
            onClick={() => {
              setMobileInspectorOpen(false);
              setIsLeftPanelOpen(!isLeftPanelOpen);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
              isLeftPanelOpen
                ? 'bg-[#0D5771]/10 text-[#0D5771] font-extrabold'
                : 'text-slate-600'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#0D5771]" />
            <span className="text-[10px] font-bold">AI &amp; Theme</span>
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
  initialBusinessName,
  initialTheme,
  projectId,
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
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F1F5F9]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#0D5771] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#64748B] text-xs font-mono">Initializing Cuzmify Studio…</p>
        </div>
      </div>
    );
  }

  return (
    <EditorShellInner />
  );
}
