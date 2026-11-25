'use client';

import React, { useState } from 'react';
import {
  LayoutTemplate,
  Puzzle,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Globe,
  Sparkles,
  GripVertical,
  Layers,
  CheckCircle2,
  Zap,
  PhoneCall,
  Star,
  Cpu,
  X,
  Sliders,
  Instagram,
  Scissors,
  Store,
} from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import type { PanelTab } from './engine/EditorContext';
import { AIPanel } from './ai/AIPanel';
import { BLOCK_HTML_MAP } from './engine/BlockRegistry';

const TABS: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
  { id: 'add', label: 'AI & Add', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'pages', label: 'Sections', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'modules', label: 'Business', icon: <Puzzle className="w-3.5 h-3.5" /> },
];

const SECTION_BLOCKS = [
  {
    id: 'cuzmify-hero',
    label: 'Hero Banner',
    desc: 'Headline, cover photo & booking button',
    icon: <LayoutTemplate className="w-4 h-4 text-[#0D5771]" />,
    bg: 'bg-slate-100',
  },
  {
    id: 'cuzmify-gallery',
    label: 'Portfolio Grid',
    desc: 'Responsive client work & Instagram photo showcase',
    icon: <ImageIcon className="w-4 h-4 text-sky-600" />,
    bg: 'bg-sky-50',
  },
  {
    id: 'cuzmify-services',
    label: 'Services & Packages',
    desc: 'Bookable service list with rates & durations',
    icon: <Sparkles className="w-4 h-4 text-amber-600" />,
    bg: 'bg-amber-50',
  },
  {
    id: 'cuzmify-booking',
    label: 'WhatsApp Booking Section',
    desc: 'Direct booking block connected to your WhatsApp',
    icon: <PhoneCall className="w-4 h-4 text-emerald-600" />,
    bg: 'bg-emerald-50',
  },
  {
    id: 'cuzmify-testimonials',
    label: 'Client Testimonials',
    desc: 'Social proof cards for real client feedback',
    icon: <Star className="w-4 h-4 text-amber-500" />,
    bg: 'bg-amber-50',
  },
  {
    id: 'cuzmify-cta',
    label: 'Closing Call-to-Action',
    desc: 'Final booking prompt at the bottom of your site',
    icon: <Zap className="w-4 h-4 text-[#0D5771]" />,
    bg: 'bg-teal-50',
  },
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
    const handleAITransformed = () => setTimeout(refreshSections, 80);
    window.addEventListener('cuzmify:ai-transformed', handleAITransformed);

    if (service) {
      const unsub = service.onChanged(refreshSections);
      return () => {
        unsub();
        window.removeEventListener('cuzmify:ai-transformed', handleAITransformed);
      };
    }
    return () => window.removeEventListener('cuzmify:ai-transformed', handleAITransformed);
  }, [service, refreshSections]);

  const handleMoveUp = React.useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!service || idx === 0) return;
      const secName = sections[idx]?.name || 'Section';
      service.moveSectionUp(idx);
      setSections([...(service.getSectionsList() || [])]);
      setLastAction(`Moved "${secName}" up`);
      setTimeout(() => setLastAction(null), 2000);
    },
    [service, sections]
  );

  const handleMoveDown = React.useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!service || idx >= sections.length - 1) return;
      const secName = sections[idx]?.name || 'Section';
      service.moveSectionDown(idx);
      setSections([...(service.getSectionsList() || [])]);
      setLastAction(`Moved "${secName}" down`);
      setTimeout(() => setLastAction(null), 2000);
    },
    [service, sections]
  );

  const handleRemove = React.useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!service) return;
      const secName = sections[idx]?.name || 'Section';
      service.removeSection(idx);
      setSections([...(service.getSectionsList() || [])]);
      setLastAction(`Removed "${secName}"`);
      setTimeout(() => setLastAction(null), 2000);
    },
    [service, sections]
  );

  const handleSelectSection = React.useCallback(
    (idx: number) => {
      service?.selectSectionByIndex(idx);
    },
    [service]
  );

  const handleListDragStart = React.useCallback((idx: number, e: React.DragEvent) => {
    setDraggedIdx(idx);
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleListDragOver = React.useCallback((idx: number, e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOverIdx(idx);
    setDragPos(e.clientY < rect.top + rect.height / 2 ? 'above' : 'below');
  }, []);

  const handleListDrop = React.useCallback(
    (targetIdx: number, e: React.DragEvent) => {
      e.preventDefault();
      if (draggedIdx === null || draggedIdx === targetIdx || !service) {
        setDraggedIdx(null);
        setDragOverIdx(null);
        return;
      }
      let finalIdx = dragPos === 'above' ? targetIdx : targetIdx + 1;
      if (draggedIdx < finalIdx) finalIdx -= 1;
      finalIdx = Math.max(0, Math.min(finalIdx, sections.length - 1));

      if (finalIdx !== draggedIdx) {
        const secName = sections[draggedIdx]?.name || 'Section';
        service.moveSectionTo(draggedIdx, finalIdx);
        setSections([...(service.getSectionsList() || [])]);
        setLastAction(`Reordered "${secName}"`);
        setTimeout(() => setLastAction(null), 2000);
      }
      setDraggedIdx(null);
      setDragOverIdx(null);
    },
    [draggedIdx, dragPos, service, sections]
  );

  if (sections.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D5771] font-mono flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" /> Page Sections ({sections.length})
        </span>
        <span className="text-[10px] text-slate-400">Drag or arrows</span>
      </div>

      {lastAction && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{lastAction}</span>
        </div>
      )}

      <div
        className="space-y-1.5"
        onDragEnd={() => {
          setDraggedIdx(null);
          setDragOverIdx(null);
        }}
      >
        {sections.map((sec, idx) => {
          const isDragging = draggedIdx === idx;
          const isDragOver = dragOverIdx === idx;

          return (
            <div
              key={sec.id}
              draggable
              onDragStart={(e) => handleListDragStart(idx, e)}
              onDragOver={(e) => handleListDragOver(idx, e)}
              onDragLeave={() => setDragOverIdx(null)}
              onDrop={(e) => handleListDrop(idx, e)}
              className={`group flex items-center justify-between p-2.5 rounded-xl bg-white border transition-all ${
                isDragging ? 'opacity-40 border-dashed border-[#0D5771]' : 'border-slate-200 hover:border-[#0D5771]/50'
              } ${isDragOver && dragPos === 'above' ? 'border-t-2 border-t-[#0D5771]' : ''} ${
                isDragOver && dragPos === 'below' ? 'border-b-2 border-b-[#0D5771]' : ''
              }`}
            >
              <div
                onClick={() => handleSelectSection(idx)}
                className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer select-none"
                title="Select section on canvas"
              >
                <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0D5771] shrink-0 cursor-grab" />
                <span className="w-5 h-5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-bold font-mono text-[#0D5771] shrink-0">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-[#0F172A] truncate group-hover:text-[#0D5771]">
                  {sec.name}
                </span>
              </div>

              <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={(e) => handleMoveUp(idx, e)}
                  title="Move Up"
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-[#0D5771] disabled:opacity-25 cursor-pointer"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === sections.length - 1}
                  onClick={(e) => handleMoveDown(idx, e)}
                  title="Move Down"
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-[#0D5771] disabled:opacity-25 cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRemove(idx, e)}
                  title="Remove Section"
                  className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D5771] font-mono flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#0D5771]" /> AI Copilot
          </span>
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
            READY
          </span>
        </div>
        <AIPanel />
      </div>

      <div className="h-px bg-slate-200" />

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Add Section Blocks
          </span>
          <span className="text-[10px] text-slate-400">Click or drag</span>
        </div>

        <div className="space-y-2">
          {SECTION_BLOCKS.map((block) => (
            <div
              key={block.id}
              onClick={() => handleAddBlock(block.id)}
              draggable
              onDragStart={(e) => handleDragStart(block.id, e)}
              className="group flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#0D5771]/60 transition-all cursor-pointer hover:shadow-sm"
            >
              <div className={`p-2 rounded-lg ${block.bg} border border-slate-200/80 shrink-0`}>
                {block.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#0D5771] transition-colors">
                  {block.label}
                </p>
                <p className="text-[11px] text-slate-500 leading-snug truncate">{block.desc}</p>
              </div>
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#0D5771] shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionsTab({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      <SectionReorderManager service={service} />

      <div className="h-px bg-slate-200" />

      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block px-1">
          + Insert Section
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {SECTION_BLOCKS.map((block) => (
            <button
              key={block.id}
              type="button"
              onClick={() => service?.addBlock(block.id)}
              className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#0D5771] text-[11px] font-semibold text-[#0F172A] transition-all text-left truncate cursor-pointer"
            >
              <Plus className="w-3 h-3 text-[#0D5771] shrink-0" />
              <span className="truncate">{block.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BusinessSetupTab() {
  const { setActiveModuleModal, blueprint } = useEditor();
  const mediaCount = blueprint?.mediaVault?.length || 0;
  const serviceCount = blueprint?.modules?.services?.items?.length || 0;

  const ITEMS = [
    {
      id: 'media' as const,
      title: `Instagram & Photos (${mediaCount})`,
      desc: 'Sync real IG posts, carousels & Reels or upload from device',
      icon: <Instagram className="w-4 h-4 text-pink-600" />,
      bg: 'bg-pink-50 border-pink-100',
    },
    {
      id: 'services' as const,
      title: `Services & Rates (${serviceCount})`,
      desc: 'Manage packages with Fixed, Starting From, or Custom Quote pricing',
      icon: <Scissors className="w-4 h-4 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
    },
    {
      id: 'whatsapp' as const,
      title: 'WhatsApp Enquiries',
      desc: 'Set your booking WhatsApp number & pre-filled message format',
      icon: <PhoneCall className="w-4 h-4 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      id: 'profile' as const,
      title: 'Brand, Niche & Bio',
      desc: 'Update business name, vendor niche, city & currency',
      icon: <Store className="w-4 h-4 text-[#0D5771]" />,
      bg: 'bg-sky-50 border-sky-100',
    },
    {
      id: 'payments' as const,
      title: 'Custom Domain & Pro',
      desc: 'Connect your .com / .com.ng domain & remove platform badge',
      icon: <Globe className="w-4 h-4 text-[#0D5771]" />,
      bg: 'bg-slate-100 border-slate-200',
    },
  ];

  return (
    <div className="space-y-2.5 w-full max-w-full overflow-hidden">
      <div className="px-1 space-y-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
          Business Content &amp; Setup
        </span>
        <p className="text-[11px] text-slate-500 leading-snug">
          Edit your real business data once—every website style updates automatically.
        </p>
      </div>

      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setActiveModuleModal(item.id)}
          className="w-full p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0D5771]/50 text-left flex items-start gap-3 transition-all cursor-pointer shadow-2xs"
        >
          <div className={`p-2 rounded-xl border shrink-0 ${item.bg}`}>{item.icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#0F172A]">{item.title}</p>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{item.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export function LeftPanel() {
  const { leftPanelTab, setLeftPanelTab, service, setIsLeftPanelOpen } = useEditor();

  return (
    <aside
      style={{ width: '296px', minWidth: '296px', maxWidth: '296px' }}
      className="shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden z-30"
      suppressHydrationWarning
    >
      <div className="px-3 pt-3 pb-2 border-b border-slate-200 bg-slate-50/60 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#0D5771]" /> Studio Tools
          </span>
          <button
            type="button"
            onClick={() => setIsLeftPanelOpen(false)}
            className="w-6 h-6 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 w-full gap-1 bg-slate-200/70 p-0.5 rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLeftPanelTab(tab.id)}
              className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-semibold transition-all truncate cursor-pointer ${
                leftPanelTab === tab.id
                  ? 'bg-white text-[#0D5771] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {leftPanelTab === 'add' && <AddTab service={service} />}
        {leftPanelTab === 'pages' && <SectionsTab service={service} />}
        {leftPanelTab === 'modules' && <BusinessSetupTab />}
      </div>
    </aside>
  );
}
