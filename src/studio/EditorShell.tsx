'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { EyeOff } from 'lucide-react';
import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { BottomBar } from './BottomBar';
import { PublishModal } from './publish/PublishModal';
import { StudioInfrastructureHub } from './modules/StudioInfrastructureHub';
import { MobileStudioNotice } from './MobileStudioNotice';
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
    const publicUrl = `/site/${projectId}`;

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
            htmlContent: service.getHtml(),
            grapesData: service.getProjectData(),
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
      {/* Mobile Device & Viewport Advisory Notice */}
      <MobileStudioNotice />

      {/* Top Bar */}
      {!isPreviewMode && !activeModuleModal && (
        <TopBar
          onPublish={() => setShowPublish(true)}
          isPublishing={isPublishing}
        />
      )}

      {/* Main 3-column layout */}
      <div className={`flex flex-1 overflow-hidden min-h-0 relative ${activeModuleModal ? 'hidden' : ''}`}>
        {!isPreviewMode && isLeftPanelOpen && <LeftPanel />}

        {/* GrapesJS Canvas — always mounted */}
        <Canvas />

        {!isPreviewMode && selectedComponent.type && <RightPanel />}
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
        <div className="fixed bottom-14 right-6 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#0D5771] text-white shadow-2xl border border-white/20 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-300 font-sans text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Bottom Status Bar */}
      {!isPreviewMode && !activeModuleModal && <BottomBar />}

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
