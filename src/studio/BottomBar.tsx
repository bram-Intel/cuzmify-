'use client';

import React from 'react';
import { ShieldCheck, Palette, Code2 } from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import { TEMPLATE_ENGINES } from '@/core/template-engines';

export function BottomBar() {
  const { selectedComponent, businessName, templateId } = useEditor();

  const cleanSlug = (businessName || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28) || 'studio';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const displayUrl = rootDomain ? `${cleanSlug}.${rootDomain}` : `cuzmify.vercel.app/s/${cleanSlug}`;
  const templateLabel = TEMPLATE_ENGINES[templateId]?.name || 'Editorial Atelier';

  return (
    <footer
      className="h-7 bg-white border-t border-slate-200 flex items-center justify-between px-4 shrink-0 font-mono text-[11px] select-none text-slate-500"
      suppressHydrationWarning
    >
      {/* Left: Live URL & SSL */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-700">{displayUrl}</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>HTTPS Ready</span>
        </div>
      </div>

      {/* Center: Selected Element Tag */}
      <div className="flex items-center gap-1.5 truncate max-w-[320px]">
        {selectedComponent.type ? (
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] text-[#0D5771] font-semibold">
            <Code2 className="w-3 h-3 text-[#0D5771]" />
            <span>&lt;{selectedComponent.type.toLowerCase()}&gt; selected</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[10px]">Click any text, image, or button on canvas to edit</span>
        )}
      </div>

      {/* Right: Active Template Engine */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
        <Palette className="w-3 h-3 text-[#0D5771]" />
        <span className="font-semibold">{templateLabel}</span>
      </div>
    </footer>
  );
}
