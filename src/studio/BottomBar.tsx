'use client';

import React from 'react';
import { Layers, ShieldCheck, Palette, Code2 } from 'lucide-react';
import { useEditor } from './engine/EditorContext';

export function BottomBar() {
  const { theme, selectedComponent, businessName } = useEditor();

  const domain = `${(businessName || 'glorybeauty').toLowerCase().replace(/\s+/g, '')}.cuzmify.com`;

  return (
    <footer
      className="h-7 bg-white border-t border-slate-200 flex items-center justify-between px-3 shrink-0 font-mono text-[11px] select-none text-slate-500"
      suppressHydrationWarning
    >
      {/* Left: Domain & SSL Status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-700">{domain}</span>
        </div>
        <span className="text-slate-300">•</span>
        <div className="flex items-center gap-1 text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>SSL Edge</span>
        </div>
      </div>

      {/* Center: Selected Element Breadcrumb Path */}
      <div className="flex items-center gap-1.5 truncate max-w-[320px]">
        {selectedComponent.type ? (
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[10px] text-[#0D5771] font-semibold">
            <Code2 className="w-3 h-3 text-[#0D5771]" />
            <span>&lt;{selectedComponent.type.toLowerCase()}&gt;</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[10px]">Canvas Ready</span>
        )}
      </div>

      {/* Right: Active Theme & Engine */}
      <div className="flex items-center gap-2 text-[10px]">
        <div className="flex items-center gap-1 text-slate-600">
          <Palette className="w-3 h-3 text-[#0D5771]" />
          <span className="capitalize font-medium">{theme || 'bram-light'}</span>
        </div>
      </div>
    </footer>
  );
}
