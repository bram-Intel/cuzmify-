'use client';

import React, { useState } from 'react';
import {
  LayoutTemplate, FileText, Puzzle, Image,
  ChevronRight, ChevronUp, ChevronDown, Trash2, Plus, Globe, BookOpen,
  ShoppingCart, Calendar, BarChart2, MessageSquare, Sparkles,
  GripVertical, Layers, CheckCircle2, ShieldCheck, Zap,
  SlidersHorizontal, PhoneCall, Star, ArrowUpRight, Cpu, X, Sliders
} from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import type { PanelTab } from './engine/EditorContext';
import type { CuzmifyModuleType } from '@/core/types';
import { AIPanel } from './ai/AIPanel';
import Link from 'next/link';
import { BLOCK_HTML_MAP } from './engine/BlockRegistry';

const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'add', label: 'BLOCKS', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
  { id: 'pages', label: 'PAGES', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'modules', label: 'MODULES', icon: <Puzzle className="w-3.5 h-3.5" /> },
];

const SECTION_BLOCKS = [
  {
    id: 'cuzmify-hero',
    label: 'Hero Suite',
    tag: 'HEADLINE',
    desc: 'High-converting headline with direct WhatsApp booking CTA',
    icon: <LayoutTemplate className="w-4 h-4 text-[#0D5771]" />,
    bg: 'bg-slate-100',
  },
  {
    id: 'cuzmify-services',
    label: 'Services & Pricing',
    tag: 'CATALOG',
    desc: 'Interactive service list cards with pricing & duration',
    icon: <Sparkles className="w-4 h-4 text-amber-600" />,
    bg: 'bg-amber-50',
  },
  {
    id: 'cuzmify-gallery',
    label: 'Portfolio Showcase',
    tag: 'GALLERY',
    desc: 'Full-bleed responsive photo grid with lightbox ready',
    icon: <Image className="w-4 h-4 text-sky-600" />,
    bg: 'bg-sky-50',
  },
  {
    id: 'cuzmify-booking',
    label: 'WhatsApp Reservation',
    tag: 'CONVERSION',
    desc: 'Direct 1-click booking form sending pre-filled messages',
    icon: <PhoneCall className="w-4 h-4 text-emerald-600" />,
    bg: 'bg-emerald-50',
  },
  {
    id: 'cuzmify-testimonials',
    label: 'Client Reviews',
    tag: 'SOCIAL PROOF',
    desc: 'Rated testimonial cards with star ratings & client details',
    icon: <Star className="w-4 h-4 text-amber-500" />,
    bg: 'bg-amber-50',
  },
  {
    id: 'cuzmify-cta',
    label: 'Launch Call-to-Action',
    tag: 'CONVERSION',
    desc: 'High-impact gradient banner with multi-CTA buttons',
    icon: <Zap className="w-4 h-4 text-[#0D5771]" />,
    bg: 'bg-teal-50',
  },
];

const PAGES = [
  { id: 'home', label: 'Home Page', path: '/', isHome: true, status: 'Active' },
  { id: 'about', label: 'About Studio', path: '/about', isHome: false, status: 'Draft' },
  { id: 'services', label: 'Services & Menu', path: '/services', isHome: false, status: 'Draft' },
  { id: 'gallery', label: 'Live Portfolio', path: '/portfolio', isHome: false, status: 'Draft' },
  { id: 'contact', label: 'WhatsApp Booking', path: '/booking', isHome: false, status: 'Draft' },
];

const MODULES: { type: CuzmifyModuleType; label: string; tag: string; desc: string; icon: React.ReactNode }[] = [
  { type: 'BOOKING', label: 'WhatsApp Booking Engine', tag: 'CONVERSION', desc: 'Direct WhatsApp integration with automated booking request formats', icon: <PhoneCall className="w-4 h-4" /> },
  { type: 'CATALOG', label: 'Services & Price Catalog', tag: 'COMMERCE', desc: 'Interactive service catalog with dynamic pricing & package tiering', icon: <LayoutTemplate className="w-4 h-4" /> },
  { type: 'CART', label: 'E-Commerce Cart', tag: 'CHECKOUT', desc: 'Attach cart state, add-to-cart triggers, and instant checkout link', icon: <ShoppingCart className="w-4 h-4" /> },
  { type: 'CRM', label: 'Client Lead CRM', tag: 'INFRASTRUCTURE', desc: 'Automated contact logging & client history persistence', icon: <MessageSquare className="w-4 h-4" /> },
  { type: 'ANALYTICS', label: 'Conversion Analytics', tag: 'DATA', desc: 'Track visitor traffic, session durations, and booking click-throughs', icon: <BarChart2 className="w-4 h-4" /> },
  { type: 'PAYMENTS', label: 'Payment Gateway', tag: 'PAYMENTS', desc: 'Accept deposit payments online via Paystack / Flutterwave', icon: <ShoppingCart className="w-4 h-4" /> },
];

function SectionReorderManager({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  const [sections, setSections] = useState<{ id: string; type: string; name: string; index: number }[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState<'above' | 'below'>('below');
  const [lastAction, setLastAction] = useState<string | null>(null);

  const refreshSections = React.useCallback(() => {
    if (!service) return;
    try {
      const list = service.getSectionsList() || [];
      setSections([...list]);
    } catch {
      // service not ready
    }
  }, [service]);

  React.useEffect(() => {
    refreshSections();
    const handleAITransformed = () => {
      setTimeout(refreshSections, 80);
    };

    window.addEventListener('cuzmify:ai-transformed', handleAITransformed);

    if (service) {
      const unsub = service.onChanged(refreshSections);
      return () => {
        unsub();
        window.removeEventListener('cuzmify:ai-transformed', handleAITransformed);
      };
    }

    return () => {
      window.removeEventListener('cuzmify:ai-transformed', handleAITransformed);
    };
  }, [service, refreshSections]);

  // ── Move Up / Down / Remove (with full event isolation & instant sync) ──
  const handleMoveUp = React.useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    if (!service || idx === 0) return;

    const secName = sections[idx]?.name || 'Section';
    service.moveSectionUp(idx);
    const updated = service.getSectionsList() || [];
    setSections([...updated]);
    setLastAction(`Moved "${secName}" Up (Position ${idx + 1} → ${idx})`);
    setTimeout(() => setLastAction(null), 2500);
  }, [service, sections]);

  const handleMoveDown = React.useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    if (!service || idx >= sections.length - 1) return;

    const secName = sections[idx]?.name || 'Section';
    service.moveSectionDown(idx);
    const updated = service.getSectionsList() || [];
    setSections([...updated]);
    setLastAction(`Moved "${secName}" Down (Position ${idx + 1} → ${idx + 2})`);
    setTimeout(() => setLastAction(null), 2500);
  }, [service, sections]);

  const handleRemove = React.useCallback((idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    if (!service) return;

    const secName = sections[idx]?.name || 'Section';
    service.removeSection(idx);
    const updated = service.getSectionsList() || [];
    setSections([...updated]);
    setLastAction(`Removed "${secName}"`);
    setTimeout(() => setLastAction(null), 2500);
  }, [service, sections]);

  const handleSelectSection = React.useCallback((idx: number) => {
    if (!service) return;
    service.selectSectionByIndex(idx);
  }, [service]);

  // ── Deterministic Drag-and-Drop ───────────────────────────────────────────
  const handleListDragStart = React.useCallback((idx: number, e: React.DragEvent) => {
    setDraggedIdx(idx);
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  }, []);

  const handleListDragOver = React.useCallback((idx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'above' : 'below';
    setDragOverIdx(idx);
    setDragPos(pos);
  }, []);

  const handleListDragLeave = React.useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      setDragOverIdx(null);
    }
  }, []);

  const handleListDrop = React.useCallback((targetIdx: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    if (draggedIdx === null || draggedIdx === targetIdx || !service) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    let finalIdx: number;
    if (dragPos === 'above') {
      finalIdx = targetIdx;
    } else {
      finalIdx = targetIdx + 1;
    }

    if (draggedIdx < finalIdx) {
      finalIdx -= 1;
    }

    finalIdx = Math.max(0, Math.min(finalIdx, sections.length - 1));

    if (finalIdx !== draggedIdx) {
      const secName = sections[draggedIdx]?.name || 'Section';
      service.moveSectionTo(draggedIdx, finalIdx);
      const updated = service.getSectionsList() || [];
      setSections([...updated]);
      setLastAction(`Reordered "${secName}" to Position ${finalIdx + 1}`);
      setTimeout(() => setLastAction(null), 2500);
    }

    setDraggedIdx(null);
    setDragOverIdx(null);
  }, [draggedIdx, dragPos, service, sections]);

  const handleListDragEnd = React.useCallback(() => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  }, []);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D5771] font-mono flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#0D5771]" /> LIVE SECTION ORDER ({sections.length})
        </span>
        <span className="text-[9px] text-[#94A3B8] font-mono">1-Click or Drag</span>
      </div>

      {lastAction && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold animate-in fade-in duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{lastAction}</span>
        </div>
      )}

      <div className="space-y-1.5" onDragEnd={handleListDragEnd}>
        {sections.map((sec, idx) => {
          const isDragging = draggedIdx === idx;
          const isDragOver = dragOverIdx === idx;

          return (
            <div
              key={sec.id}
              draggable
              onDragStart={(e) => handleListDragStart(idx, e)}
              onDragOver={(e) => handleListDragOver(idx, e)}
              onDragLeave={handleListDragLeave}
              onDrop={(e) => handleListDrop(idx, e)}
              className={`group relative flex items-center justify-between p-2.5 rounded-2xl bg-[#FFFFFF] border transition-all shadow-sm hover:shadow-md hover:shadow-[#0D5771]/10 ${
                isDragging
                  ? 'opacity-40 border-dashed border-[#0D5771]'
                  : 'border-[#E2E8F0] hover:border-[#0D5771]'
              } ${
                isDragOver && dragPos === 'above'
                  ? 'border-t-2 border-t-[#0D5771] bg-[#0D5771]/5'
                  : ''
              } ${
                isDragOver && dragPos === 'below'
                  ? 'border-b-2 border-b-[#0D5771] bg-[#0D5771]/5'
                  : ''
              }`}
            >
              {/* Left clickable zone: select section in canvas */}
              <div
                onClick={() => handleSelectSection(idx)}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                title="Click to select section in canvas"
              >
                <GripVertical className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0D5771] shrink-0 cursor-grab active:cursor-grabbing" />
                <span className="w-5 h-5 rounded-lg bg-[#F7FAFC] border border-[#E2E8F0] flex items-center justify-center text-[10px] font-bold font-mono text-[#0D5771] shrink-0">
                  {idx + 1}
                </span>
                <span className="text-[11px] font-extrabold text-[#1A202C] truncate group-hover:text-[#0D5771] transition-colors">
                  {sec.name}
                </span>
              </div>

              {/* Right isolated zone: action buttons (fully isolated from select) */}
              <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => {
                  // Catch-all: prevent ANY click in the button zone
                  // from bubbling to the select handler
                  e.stopPropagation();
                }}
              >
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={(e) => handleMoveUp(idx, e)}
                  title="Move Up 1 position"
                  className="p-1.5 rounded-lg hover:bg-[#0D5771]/10 text-[#64748B] hover:text-[#0D5771] disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5 pointer-events-none" />
                </button>
                <button
                  type="button"
                  disabled={idx === sections.length - 1}
                  onClick={(e) => handleMoveDown(idx, e)}
                  title="Move Down 1 position"
                  className="p-1.5 rounded-lg hover:bg-[#0D5771]/10 text-[#64748B] hover:text-[#0D5771] disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5 pointer-events-none" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRemove(idx, e)}
                  title="Remove Section"
                  className="p-1 rounded-lg hover:bg-rose-50 text-[#94A3B8] hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddTab({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  const handleDragStart = (blockId: string, e: React.DragEvent) => {
    const rawHtml = BLOCK_HTML_MAP[blockId];
    if (rawHtml) {
      e.dataTransfer.setData('text/html', rawHtml);
      e.dataTransfer.setData('text/plain', rawHtml);
    }
  };

  const handleAddBlock = (blockId: string) => {
    if (!service) return;
    if (typeof service.addBlock === 'function') {
      service.addBlock(blockId);
    } else {
      (service as any).adapter?.addBlock?.(blockId);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Intelligence Assistant */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D5771] font-mono flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#0D5771]" /> CUZMIFY AI ENGINE
          </span>
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
            ACTIVE
          </span>
        </div>
        <AIPanel />
      </div>

      <div className="h-px bg-[#E2E8F0]" />

      {/* Live Section Order Manager (Up/Down/Delete) */}
      <SectionReorderManager service={service} />

      <div className="h-px bg-[#E2E8F0]" />

      {/* Sections Palette */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] font-mono">
            COMPONENT PALETTE
          </span>
          <span className="text-[9px] text-[#94A3B8] font-mono">Click to Add</span>
        </div>

        <div className="space-y-2">
          {SECTION_BLOCKS.map((block) => (
            <div
              key={block.id}
              onClick={() => handleAddBlock(block.id)}
              draggable
              onDragStart={(e) => handleDragStart(block.id, e)}
              title={`Click to insert ${block.label}`}
              className="group relative flex items-start gap-3 p-3 rounded-2xl bg-[#F7FAFC] hover:bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#0D5771] transition-all duration-200 cursor-pointer shadow-none hover:shadow-md hover:shadow-[#0D5771]/10 overflow-hidden"
            >
              {/* Icon Container */}
              <div className={`p-2 rounded-xl ${block.bg} border border-[#E2E8F0] shrink-0 group-hover:scale-105 transition-transform`}>
                {block.icon}
              </div>

              {/* Text Meta */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div>
                  <p className="text-[11px] font-extrabold text-[#1A202C] group-hover:text-[#0D5771] transition-colors">
                    {block.label}
                  </p>
                </div>
                <p className="text-[10px] text-[#64748B] leading-tight line-clamp-2">{block.desc}</p>
              </div>

              {/* Action trigger */}
              <div className="shrink-0 self-center">
                <Plus className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0D5771] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PagesTab({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  const [activePage, setActivePage] = useState('home');

  const handleAddBlock = (blockId: string) => {
    if (!service) return;
    service.addBlock(blockId);
  };

  return (
    <div className="space-y-5 w-full max-w-full overflow-hidden">
      {/* Page Routes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] font-mono">
            PAGE ROUTES
          </span>
          <span className="text-[9px] font-mono text-[#0D5771] bg-[#F7FAFC] px-2 py-0.5 rounded-full border border-[#E2E8F0]">
            5 Routes
          </span>
        </div>

        <div className="space-y-1.5">
          {PAGES.map((page) => (
            <div
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                activePage === page.id
                  ? 'bg-[#FFFFFF] border-[#0D5771] text-[#1A202C] shadow-md shadow-[#0D5771]/10 font-bold'
                  : 'bg-[#F7FAFC] hover:bg-[#FFFFFF] border-[#E2E8F0] text-[#64748B] hover:text-[#1A202C]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Globe className={`w-3.5 h-3.5 shrink-0 ${activePage === page.id ? 'text-[#0D5771]' : 'text-[#94A3B8]'}`} />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold truncate">{page.label}</p>
                  <p className="text-[9px] font-mono text-[#94A3B8] truncate">{page.path}</p>
                </div>
              </div>

              {page.isHome ? (
                <span className="text-[8px] font-extrabold font-mono text-[#0D5771] uppercase bg-[#0D5771]/10 px-2 py-0.5 rounded-full border border-[#0D5771]/20 shrink-0">
                  HOME
                </span>
              ) : (
                <span className="text-[8px] font-mono text-[#94A3B8] shrink-0">{page.status}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-[#E2E8F0]" />

      {/* SECTION RE-ORDER & LAYER MANAGER */}
      <SectionReorderManager service={service} />

      {/* Quick Add Section Buttons */}
      <div className="pt-2 space-y-1.5">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#64748B] font-mono block px-1">
          + RESTORE / ADD SECTION
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {SECTION_BLOCKS.map((block) => (
            <button
              key={block.id}
              onClick={() => handleAddBlock(block.id)}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F7FAFC] hover:bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#0D5771] text-[10px] font-extrabold text-[#1A202C] transition-all text-left truncate"
            >
              <Plus className="w-3 h-3 text-[#0D5771] shrink-0" />
              <span className="truncate">{block.label.replace(' Section', '').replace(' Showcase', '')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModulesTab() {
  const { activeModules } = useEditor();

  const attachedModules = MODULES.filter((mod) => activeModules.includes(mod.type));

  return (
    <div className="space-y-3 w-full max-w-full overflow-hidden">
      <div className="px-1 space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] font-mono block">
          ATTACHED INFRASTRUCTURE
        </span>
        <p className="text-[10px] text-[#64748B] leading-relaxed">
          Active business capabilities wired to your project and live on edge APIs.
        </p>
      </div>

      <div className="space-y-2">
        {attachedModules.map((mod) => (
          <div
            key={mod.type}
            className="p-3.5 rounded-2xl border bg-emerald-50/50 border-emerald-300 shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl shrink-0 bg-emerald-100 text-emerald-700">
                  {mod.icon}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div>
                    <p className="text-[11px] font-bold text-[#1A202C]">{mod.label}</p>
                  </div>
                  <p className="text-[10px] text-[#64748B] leading-snug">{mod.desc}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between">
              <span className="text-[9px] font-mono text-emerald-700 flex items-center gap-1 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Wired to Edge Infrastructure
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300 font-mono">
                ✓ Attached
              </span>
            </div>
          </div>
        ))}

        {attachedModules.length === 0 && (
          <div className="p-4 text-center bg-[#F7FAFC] rounded-2xl border border-[#E2E8F0]">
            <p className="text-xs text-[#64748B] font-bold">No modules attached</p>
            <p className="text-[10px] text-[#94A3B8] mt-1">Add modules from your dashboard to connect capabilities.</p>
          </div>
        )}
      </div>

      <Link
        href="/dashboard"
        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-dashed border-[#0D5771]/30 text-[#0D5771] hover:bg-[#F7FAFC] hover:border-[#0D5771]/60 text-[11px] font-bold transition-all mt-3 group shadow-none hover:shadow-sm"
      >
        <Plus className="w-4 h-4 text-[#0D5771] group-hover:scale-110 transition-transform" />
        <span>Add More Modules in Dashboard</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-[#0D5771]" />
      </Link>
    </div>
  );
}

export function LeftPanel() {
  const { leftPanelTab, setLeftPanelTab, service, setIsLeftPanelOpen } = useEditor();

  return (
    <aside
      style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}
      className="shrink-0 bg-[#FFFFFF] border-r border-[#E2E8F0] flex flex-col overflow-hidden shadow-sm z-30 animate-in slide-in-from-left duration-200"
      suppressHydrationWarning
    >
      {/* Header Tabs */}
      <div className="p-3 border-b border-[#E2E8F0] bg-[#F7FAFC] shrink-0 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0D5771] font-mono flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#0D5771]" /> STUDIO PANEL
          </span>
          <button
            onClick={() => setIsLeftPanelOpen(false)}
            className="p-1 rounded-lg hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#1A202C] transition-all"
            title="Close Panel"
          >
            <X className="w-4 h-4 text-[#0D5771]" />
          </button>
        </div>

        <div className="grid grid-cols-3 w-full gap-1 bg-[#E2E8F0]/60 p-1 rounded-2xl border border-[#E2E8F0]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLeftPanelTab(tab.id)}
              className={`w-full flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-extrabold tracking-wider transition-all truncate ${
                leftPanelTab === tab.id
                  ? 'bg-[#FFFFFF] text-[#0D5771] shadow-sm font-bold border border-[#E2E8F0]'
                  : 'text-[#64748B] hover:text-[#1A202C] hover:bg-[#FFFFFF]/60'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3.5 scrollbar-thin">
        {leftPanelTab === 'add' && <AddTab service={service} />}
        {leftPanelTab === 'pages' && <PagesTab service={service} />}
        {leftPanelTab === 'modules' && <ModulesTab />}
      </div>
    </aside>
  );
}
