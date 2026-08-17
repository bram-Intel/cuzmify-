'use client';

import React from 'react';
import {
  Undo2, Redo2, Monitor, Tablet, Smartphone,
  Eye, EyeOff, Rocket, Save, CheckCircle2,
  AlertCircle, Loader2, ShoppingBag, Globe, Layers, Sliders, ArrowLeft, Sun, Moon, PanelLeftOpen, PanelLeftClose
} from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import type { Breakpoint } from './engine/EditorContext';
import Link from 'next/link';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';

interface TopBarProps {
  onPublish: () => void;
  isPublishing: boolean;
}

const BREAKPOINTS: { id: Breakpoint; label: string; icon: React.ReactNode }[] = [
  { id: 'desktop', label: 'Desktop', icon: <Monitor className="w-3.5 h-3.5" /> },
  { id: 'tablet', label: 'Tablet', icon: <Tablet className="w-3.5 h-3.5" /> },
  { id: 'mobile', label: 'Mobile', icon: <Smartphone className="w-3.5 h-3.5" /> },
];

function SaveIndicator() {
  const { saveState } = useEditor();

  if (saveState === 'saving') return (
    <span className="flex items-center gap-1 text-[10px] font-mono text-[#64748B]">
      <Loader2 className="w-3 h-3 animate-spin text-[#0D5771]" /> Saving…
    </span>
  );
  if (saveState === 'saved') return (
    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-bold">
      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Saved
    </span>
  );
  if (saveState === 'unsaved') return (
    <span className="flex items-center gap-1 text-[10px] font-mono text-amber-600 font-bold">
      <AlertCircle className="w-3 h-3 text-amber-600" /> Unsaved
    </span>
  );
  if (saveState === 'error') return (
    <span className="flex items-center gap-1 text-[10px] font-mono text-red-600 font-bold">
      <AlertCircle className="w-3 h-3 text-red-600" /> Save error
    </span>
  );
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

  const [justSaved, setJustSaved] = React.useState(false);

  return (
    <header className="h-14 bg-[#FFFFFF] border-b border-[#E2E8F0] flex items-center justify-between px-4 gap-4 shrink-0 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.03)]" suppressHydrationWarning>
      
      {/* LEFT: Logo + Brand + Project Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className={`p-1.5 rounded-xl border transition-all ${
            isLeftPanelOpen
              ? 'bg-[#F7FAFC] border-[#E2E8F0] text-[#0D5771] hover:bg-[#FFFFFF]'
              : 'bg-[#0D5771] border-[#0D5771] text-white shadow-md'
          }`}
          title={isLeftPanelOpen ? 'Close Left Panel' : 'Open Left Panel'}
        >
          {isLeftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <CuzmifyLogo className="w-8 h-8 flex-shrink-0 group-hover:scale-105 transition-transform" />
          <div className="hidden md:block">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs font-black tracking-tight text-[#1A202C] font-display">
                CUZM<span className="text-[#0D5771]">IFY</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#0D5771]/10 text-[#0D5771] font-mono text-[8px] font-bold uppercase tracking-wider border border-[#0D5771]/20">
                STUDIO v3.0
              </span>
            </div>
            <span className="block text-[8px] tracking-[0.2em] text-[#0D5771] uppercase font-bold font-mono mt-0.5">
              BY BRAM INTEL
            </span>
          </div>
        </Link>

        <div className="w-px h-5 bg-[#E2E8F0] hidden md:block" />

        <div className="min-w-0 hidden lg:block">
          <p className="text-[#1A202C] font-extrabold text-xs truncate max-w-[170px]">
            {businessName || 'Glory Beauty Studio'}
          </p>
          <SaveIndicator />
        </div>

        {/* Global Platform Nav Switcher */}
        <nav className="hidden xl:flex items-center gap-1 bg-[#F7FAFC] p-1 rounded-full border border-[#E2E8F0] ml-2">
          {[
            { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
            { href: '/importer', label: 'Revamp', icon: Globe },
            { href: '/dashboard', label: 'Dashboard', icon: Layers },
          ].map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1 rounded-full text-[10px] font-bold text-[#64748B] hover:text-[#0D5771] hover:bg-[#FFFFFF] flex items-center gap-1.5 transition-all shadow-none hover:shadow-sm"
              >
                <IconComp className="w-3 h-3 text-[#0D5771]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* CENTER: Undo/Redo + Breakpoints */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-[#F7FAFC] border border-[#E2E8F0] rounded-xl p-0.5">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1A202C] hover:bg-[#FFFFFF] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-sm"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1A202C] hover:bg-[#FFFFFF] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-sm"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive Breakpoints */}
        <div className="flex items-center bg-[#F7FAFC] border border-[#E2E8F0] rounded-xl p-0.5">
          {BREAKPOINTS.map((bp) => (
            <button
              key={bp.id}
              onClick={() => handleDeviceChange(bp.id)}
              title={bp.label}
              className={`p-1.5 rounded-lg transition-all ${
                breakpoint === bp.id
                  ? 'bg-[#0D5771] text-white shadow-sm font-bold'
                  : 'text-[#64748B] hover:text-[#1A202C] hover:bg-[#FFFFFF]'
              }`}
            >
              {bp.icon}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={async () => {
            if (confirm('Reset canvas to pristine default template?')) {
              try {
                localStorage.clear();
                await fetch('/api/sites', { method: 'DELETE' });
              } catch {}
              window.location.reload();
            }
          }}
          title="Reset canvas to clean default state"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F7FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#1A202C] hover:bg-[#FFFFFF] hover:border-amber-400 text-[11px] font-bold transition-all"
        >
          <span>Reset Template</span>
        </button>

        <button
          onClick={async () => {
            await handleSave();
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2500);
          }}
          disabled={saveState === 'saving'}
          className={`hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all shadow-none hover:shadow-sm cursor-pointer ${
            justSaved || saveState === 'saved'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : saveState === 'saving'
              ? 'bg-slate-100 border-slate-200 text-slate-500'
              : 'bg-[#F7FAFC] border-[#E2E8F0] text-[#1A202C] hover:bg-[#FFFFFF] hover:border-[#0D5771]/40'
          }`}
          title="Save progress to cloud database (Ctrl+S)"
        >
          {saveState === 'saving' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D5771]" />
              <span>Saving…</span>
            </>
          ) : justSaved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50 duration-150" />
              <span className="text-emerald-700 font-extrabold">Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-[#0D5771]" />
              <span>Save</span>
            </>
          )}
        </button>

        <button
          onClick={handlePreviewToggle}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
            isPreviewMode
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
              : 'bg-[#F7FAFC] border-[#E2E8F0] text-[#1A202C] hover:bg-[#FFFFFF] hover:border-[#0D5771]/30'
          }`}
        >
          {isPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#0D5771]" />}
          <span className="hidden sm:inline">{isPreviewMode ? 'Exit Preview' : 'Preview'}</span>
        </button>

        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-extrabold text-[11px] transition-all shadow-md shadow-[#0D5771]/20 hover:scale-[1.02] disabled:opacity-60"
        >
          {isPublishing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Rocket className="w-3.5 h-3.5 text-[#72B9F3]" />
          )}
          <span>{isPublishing ? 'Launching…' : 'Launch'}</span>
        </button>
      </div>
    </header>
  );
}
