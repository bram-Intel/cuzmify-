'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface StudioLoaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Signature Cuzmify Studio loader with spinning teal aura, Sparkles core, and gradient progress bar.
 * Shared across Desktop Canvas, Mobile Preview, EditorShell boot, and Studio session gate.
 */
export function StudioLoader({
  title = 'Initializing Cuzmify Studio',
  subtitle = 'Hydrating visual canvas & design tokens…',
  className = '',
}: StudioLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center bg-[#FFFFFF] animate-in fade-in duration-200 ${className}`}>
      <div className="flex flex-col items-center space-y-4 max-w-sm text-center px-6">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0D5771] to-teal-400 animate-spin opacity-70 blur-xs" />
          <div className="absolute w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md border border-slate-100">
            <Sparkles className="w-5 h-5 text-[#0D5771] animate-pulse" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-slate-800 font-display tracking-tight uppercase">
            {title}
          </h3>
          <p className="text-[10px] text-slate-500 font-mono">{subtitle}</p>
        </div>
        <div className="w-40 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-[#0D5771] to-teal-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
