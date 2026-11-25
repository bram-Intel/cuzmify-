'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  Rocket,
  Save,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  PanelLeft,
  PanelRight,
  Layers,
  Sliders,
} from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import type { Breakpoint } from './engine/EditorContext';
import { TEMPLATE_ENGINE_LIST } from '@/core/template-engines';
import Link from 'next/link';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';

interface TopBarProps {
  onPublish: () => void;
  isPublishing: boolean;
  isRightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
}

const BREAKPOINTS: { id: Breakpoint; label: string; widthLabel: string; icon: React.ReactNode }[] = [
  { id: 'desktop', label: 'Desktop', widthLabel: '100%', icon: <Monitor className="w-3.5 h-3.5" /> },
  { id: 'tablet', label: 'Tablet', widthLabel: '768px', icon: <Tablet className="w-3.5 h-3.5" /> },
  { id: 'mobile', label: 'Mobile', widthLabel: '390px', icon: <Smartphone className="w-3.5 h-3.5" /> },
];

function SaveIndicator() {
  const { saveState } = useEditor();

  if (saveState === 'saving') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
        <Loader2 className="w-2.5 h-2.5 animate-spin text-[#0D5771]" />
        <span>Saving…</span>
      </span>
    );
  }
  if (saveState === 'saved') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Saved</span>
      </span>
    );
  }
  if (saveState === 'unsaved') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>Unsaved</span>
      </span>
    );
  }
  if (saveState === 'error') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-rose-600">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        <span>Save Error</span>
      </span>
    );
  }
  return null;
}

export function TopBar({
  onPublish,
  isPublishing,
  isRightPanelOpen = true,
  onToggleRightPanel,
}: TopBarProps) {
  const {
    businessName,
    breakpoint,
    handleDeviceChange,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    handleSave,
    saveState,
    isPreviewMode,
    handlePreviewToggle,
    isLeftPanelOpen,
    setIsLeftPanelOpen,
    setActiveModuleModal,
    templateId,
    handleTemplateSwitch,
  } = useEditor();

  const [justSaved, setJustSaved] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveClick = async () => {
    await handleSave();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleResetCanvas = async () => {
    setShowMoreMenu(false);
    if (confirm('Reset this project to a fresh template? This will clear unsaved local drafts.')) {
      try {
        localStorage.clear();
      } catch {}
      window.location.reload();
    }
  };

  return (
    <header
      className="h-14 bg-white border-b border-slate-200 flex items-center justify-between gap-3 px-3 sm:px-4 shrink-0 z-50 select-none"
      suppressHydrationWarning
    >
      {/* ─── LEFT: Panel Toggle + Logo + Project Title (Never Overlaps Center!) ─── */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className={`w-8 h-8 rounded-lg hidden lg:flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isLeftPanelOpen
              ? 'bg-[#0D5771]/10 text-[#0D5771]'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={isLeftPanelOpen ? 'Hide Left Sidebar' : 'Show Left Sidebar'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <Link
          href="/dashboard"
          className="flex items-center py-1 text-slate-800 hover:opacity-85 transition-opacity shrink-0"
          title="Back to My Dashboard"
        >
          <CuzmifyLogo className="w-7 h-7" />
        </Link>

        <span className="text-slate-300 text-sm shrink-0">/</span>

        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold text-[#0F172A] truncate max-w-[140px] sm:max-w-[180px] xl:max-w-[220px] leading-tight font-display">
            {businessName || 'My Studio'}
          </span>
          <SaveIndicator />
        </div>
      </div>

      {/* ─── CENTER: Desktop Visual Controls (Compact & Balanced) ─── */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
              canUndo
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
              canRedo
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1-Tap Lossless Style Switcher */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          {TEMPLATE_ENGINE_LIST.map((tpl) => {
            const isSelected = templateId === tpl.id;
            const shortName =
              tpl.id === 'editorial-atelier' ? 'Editorial' : tpl.id === 'noir-showcase' ? 'Noir' : 'Modern';
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleTemplateSwitch(tpl.id)}
                title={`Switch to ${tpl.name} — keeps all your photos & services intact`}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected ? 'bg-white text-[#0D5771] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full border border-black/15 shrink-0"
                  style={{ backgroundColor: tpl.swatches[0] === '#09090B' ? '#09090B' : tpl.swatches[2] }}
                />
                <span>{shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Compact Icon Viewport Switcher */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          {BREAKPOINTS.map((bp) => {
            const isActive = breakpoint === bp.id;
            return (
              <button
                key={bp.id}
                type="button"
                onClick={() => handleDeviceChange(bp.id)}
                title={`${bp.label} View (${bp.widthLabel})`}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  isActive ? 'bg-white text-[#0D5771] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {bp.icon}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── RIGHT: Setup, Save, Preview & Publish ─── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveModuleModal('media')}
          className="hidden lg:flex px-3 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 bg-[#0D5771]/8 hover:bg-[#0D5771]/15 text-[#0D5771] border border-[#0D5771]/20 transition-all cursor-pointer"
          title="Manage Instagram Photos, Services, WhatsApp & Custom Domain"
        >
          <Sliders className="w-3.5 h-3.5 text-[#0D5771]" />
          <span>Content &amp; Domain</span>
        </button>

        <button
          type="button"
          onClick={handleSaveClick}
          disabled={saveState === 'saving'}
          className={`p-2 xl:px-2.5 xl:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            justSaved ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Save changes (Ctrl+S)"
        >
          {justSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4 text-slate-500" />}
          <span className="hidden xl:inline">{justSaved ? 'Saved' : 'Save'}</span>
        </button>

        <button
          type="button"
          onClick={handlePreviewToggle}
          className={`hidden lg:flex p-2 xl:px-2.5 xl:py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer ${
            isPreviewMode ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Full-screen preview"
        >
          {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-500" />}
          <span className="hidden xl:inline">Preview</span>
        </button>

        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing}
          className="px-3.5 sm:px-4 py-1.5 rounded-full lg:rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
        >
          {isPublishing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Rocket className="w-3.5 h-3.5 text-emerald-300" />
          )}
          <span>Publish</span>
        </button>

        {onToggleRightPanel && (
          <button
            type="button"
            onClick={onToggleRightPanel}
            className={`w-8 h-8 rounded-lg hidden lg:flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isRightPanelOpen
                ? 'bg-[#0D5771]/10 text-[#0D5771]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={isRightPanelOpen ? 'Hide Right Inspector' : 'Show Right Inspector'}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-10 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50">
              <Link
                href="/dashboard"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-[#0D5771]" />
                <span>My Dashboard</span>
              </Link>

              <div className="h-px bg-slate-100 my-1" />

              <button
                type="button"
                onClick={handleResetCanvas}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                <span>Reset Local Draft</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
