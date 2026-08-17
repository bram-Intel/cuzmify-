'use client';

import React from 'react';
import { Monitor, Tablet, Smartphone, ShieldCheck, Cpu } from 'lucide-react';
import { useEditor } from './engine/EditorContext';

export function BottomBar() {
  const { breakpoint, handleDeviceChange, theme, selectedComponent, businessName } = useEditor();

  const domain = `${(businessName || 'glorybeauty').toLowerCase().replace(/\s+/g, '')}.cuzmify.com`;

  return (
    <footer className="h-9 bg-[#FFFFFF] border-t border-[#E2E8F0] flex items-center justify-between px-4 shrink-0 font-mono text-[10px] shadow-sm" suppressHydrationWarning>
      {/* Left: Domain + Theme Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F7FAFC] border border-[#E2E8F0]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[#0D5771] font-bold">{domain}</span>
        </div>

        <div className="h-3 w-px bg-[#E2E8F0]" />

        <div className="hidden sm:flex items-center gap-1.5 text-[#64748B]">
          <Cpu className="w-3 h-3 text-[#0D5771]" />
          <span>Theme:</span>
          <span className="text-[#1A202C] font-bold capitalize">{theme}</span>
        </div>
      </div>

      {/* Center: Breakpoint indicator */}
      <div className="flex items-center gap-1 bg-[#F7FAFC] px-1.5 py-0.5 rounded-lg border border-[#E2E8F0]">
        {(['desktop', 'tablet', 'mobile'] as const).map((bp) => {
          const icons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
          const Icon = icons[bp];
          return (
            <button
              key={bp}
              onClick={() => handleDeviceChange(bp)}
              className={`p-1 rounded transition-all ${
                breakpoint === bp ? 'text-[#0D5771] font-bold bg-[#FFFFFF] shadow-sm' : 'text-[#94A3B8] hover:text-[#1A202C]'
              }`}
            >
              <Icon className="w-3 h-3" />
            </button>
          );
        })}
      </div>

      {/* Right: Selected element path */}
      <div className="text-[#64748B]">
        {selectedComponent.type ? (
          <span className="text-[#0D5771] font-bold bg-[#F7FAFC] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
            ‹{selectedComponent.type}›
          </span>
        ) : (
          <span className="text-[#94A3B8]">No selection</span>
        )}
      </div>
    </footer>
  );
}
