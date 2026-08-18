'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2, Redo2, Monitor, Tablet, Smartphone,
  Eye, EyeOff, Rocket, Save, CheckCircle2,
  AlertCircle, Loader2, MoreHorizontal, RotateCcw,
  PanelLeft, Layers, Sparkles, ExternalLink
} from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import type { Breakpoint } from './engine/EditorContext';
import Link from 'next/link';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';

interface TopBarProps {
  onPublish: () => void;
  isPublishing: boolean;
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
      <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
        <Loader2 className="w-2.5 h-2.5 animate-spin text-[#0D5771]" />
        <span>Saving…</span>
      </span>
    );
  }
  if (saveState === 'saved') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Saved to Cloud</span>
      </span>
    );
  }
  if (saveState === 'unsaved') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-mono text-amber-600 font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>Unsaved Changes</span>
      </span>
    );
  }
  if (saveState === 'error') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-mono text-red-600 font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <span>Save Error</span>
      </span>
    );
  }
  return null;
}

export function TopBar({ onPublish, isPublishing }: TopBarProps) {
  const {
    businessName,
    breakpoint, handleDeviceChange,
    canUndo, canRedo, handleUndo, handleRedo,
    handleSave, saveState,
    isPreviewMode, handlePreviewToggle,
    isLeftPanelOpen, setIsLeftPanelOpen,
  } = useEditor();

  const [justSaved, setJustSaved] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
    if (confirm('Reset canvas to pristine default template? This will erase local drafts.')) {
      try {
        localStorage.clear();
        await fetch('/api/sites', { method: 'DELETE' });
      } catch {}
      window.location.reload();
    }
  };

  return (
    <header
      className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-50 select-none shadow-xs"
      suppressHydrationWarning
    >
      {/* ─── LEFT: Spacious Brand, Breadcrumb & Project Name ─── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
            isLeftPanelOpen
              ? 'bg-slate-100 text-[#0D5771]'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title={isLeftPanelOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Brand & Project Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 py-1 text-slate-700 hover:text-slate-900 transition-colors group shrink-0"
            title="Return to Dashboard"
          >
            <CuzmifyLogo className="w-7 h-7 group-hover:scale-105 transition-transform" />
            <span className="text-sm font-black tracking-tight text-slate-900 font-display">
              CUZM<span className="text-[#0D5771]">IFY</span>
            </span>
          </Link>

          <span className="text-slate-300 text-sm font-light">/</span>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-extrabold text-slate-800 truncate max-w-[140px] sm:max-w-[220px] leading-snug">
              {businessName || 'Glory Beauty Studio'}
            </span>
            <SaveIndicator />
          </div>
        </div>
      </div>

      {/* ─── CENTER: Breathable, Unboxed Precision Toolbar ─── */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo / Redo buttons */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Viewport Breakpoint Switcher */}
        <div className="flex items-center gap-1">
          {BREAKPOINTS.map((bp) => {
            const isActive = breakpoint === bp.id;
            return (
              <button
                key={bp.id}
                onClick={() => handleDeviceChange(bp.id)}
                title={`${bp.label} (${bp.widthLabel})`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0D5771] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {bp.icon}
                <span className="hidden md:inline text-[11px]">{bp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── RIGHT: Clean Ghost Actions & Primary Launch Button ─── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Ghost Save button */}
        <button
          onClick={handleSaveClick}
          disabled={saveState === 'saving'}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            justSaved
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Save website state to cloud (Ctrl+S)"
        >
          {justSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Saved</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Save</span>
            </>
          )}
        </button>

        {/* Ghost Preview button */}
        <button
          onClick={handlePreviewToggle}
          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
            isPreviewMode
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Toggle preview mode"
        >
          {isPreviewMode ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Preview</span>
            </>
          )}
        </button>

        {/* Primary Confident Launch Button */}
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="px-4 py-2 rounded-xl bg-[#0D5771] hover:bg-[#083D50] active:scale-98 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#0D5771]/20 transition-all cursor-pointer disabled:opacity-60 hover:scale-[1.02]"
        >
          {isPublishing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Rocket className="w-3.5 h-3.5 text-emerald-300" />
          )}
          <span>Launch</span>
        </button>

        {/* More Actions Dropdown Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="w-9 h-9 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-11 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <Link
                href="/dashboard"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>My Dashboard</span>
              </Link>
              <Link
                href="/marketplace"
                onClick={() => setShowMoreMenu(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>Browse Marketplace</span>
              </Link>

              <div className="h-px bg-slate-100 my-1" />

              <button
                onClick={handleResetCanvas}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-red-500" />
                <span>Reset to Default Template</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
