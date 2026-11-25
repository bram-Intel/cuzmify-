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
  Image as ImageIcon,
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
      className="h-14 lg:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-4 lg:px-5 shrink-0 z-50 select-none"
      suppressHydrationWarning
    >
      {/* ─── LEFT: Panel Toggle + Brand + Project Title ─── */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className={`w-8 h-8 rounded-lg hidden lg:flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isLeftPanelOpen
              ? 'bg-[#0D5771]/10 text-[#0D5771]'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={isLeftPanelOpen ? 'Hide Tools Sidebar' : 'Show Tools Sidebar'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 py-1 text-slate-800 hover:text-[#0D5771] transition-colors shrink-0"
          title="Back to My Dashboard"
        >
          <CuzmifyLogo className="w-7 h-7" />
          <span className="hidden xl:inline text-sm font-extrabold tracking-tight text-[#0F172A] font-display">
            CUZM<span className="text-[#0D5771]">IFY</span>
          </span>
        </Link>

        <span className="text-slate-300 text-sm">/</span>

        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold text-[#0F172A] truncate max-w-[145px] sm:max-w-[200px] leading-tight font-display">
            {businessName || 'My Studio'}
          </span>
          <SaveIndicator />
        </div>
      </div>

      {/* ─── CENTER: Desktop Visual Editor Controls (Hidden on Mobile so Mobile TopBar stays airy) ─── */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200/80">
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
                  className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                  style={{ backgroundColor: tpl.swatches[0] === '#09090B' ? '#09090B' : tpl.swatches[2] }}
                />
                <span>{shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Viewport Breakpoint Switcher */}
        <div className="hidden xl:flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          {BREAKPOINTS.map((bp) => {
            const isActive = breakpoint === bp.id;
            return (
              <button
                key={bp.id}
                type="button"
                onClick={() => handleDeviceChange(bp.id)}
                title={`${bp.label} (${bp.widthLabel})`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive ? 'bg-white text-[#0D5771] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {bp.icon}
                <span className="text-[11px]">{bp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── RIGHT: Actions & Publish ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Desktop Quick Hub Triggers */}
        <button
          type="button"
          onClick={() => setActiveModuleModal('media')}
          className="hidden lg:flex px-3 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer"
          title="Instagram Sync & Media Vault"
        >
          <ImageIcon className="w-3.5 h-3.5 text-pink-600" />
          <span>IG &amp; Media</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModuleModal('services')}
          className="hidden lg:flex px-3 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 bg-[#0D5771]/8 hover:bg-[#0D5771]/15 text-[#0D5771] border border-[#0D5771]/20 transition-all cursor-pointer"
          title="Services, WhatsApp, Niche & Custom Domain"
        >
          <Sliders className="w-3.5 h-3.5 text-[#0D5771]" />
          <span>Business Setup</span>
        </button>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={saveState === 'saving'}
          className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            justSaved ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Save changes (Ctrl+S)"
        >
          {justSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-slate-500" />
              <span className="hidden md:inline">Save</span>
            </>
          )}
        </button>

        {/* Desktop Preview Toggle */}
        <button
          type="button"
          onClick={handlePreviewToggle}
          className={`hidden lg:flex px-3 py-1.5 rounded-xl text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer ${
            isPreviewMode ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Full-screen preview"
        >
          {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-500" />}
          <span>Preview</span>
        </button>

        {/* Primary Publish Button */}
        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing}
          className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full lg:rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
        >
          {isPublishing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Rocket className="w-3.5 h-3.5 text-emerald-300" />
          )}
          <span>Publish</span>
        </button>

        {/* Desktop Right Inspector Toggle */}
        {onToggleRightPanel && (
          <button
            type="button"
            onClick={onToggleRightPanel}
            className={`w-8 h-8 rounded-lg hidden lg:flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isRightPanelOpen
                ? 'bg-[#0D5771]/10 text-[#0D5771]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={isRightPanelOpen ? 'Hide Style Inspector' : 'Show Style Inspector'}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}

        {/* More Menu */}
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
