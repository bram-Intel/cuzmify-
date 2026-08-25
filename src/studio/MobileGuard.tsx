'use client';

import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, X, ArrowRight } from 'lucide-react';

export function MobileGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => {
      const narrowScreen = window.innerWidth < 1024;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(narrowScreen && (hasTouch || mobileUA));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Still hydrating — render nothing to avoid flash
  if (isMobile === null) return null;

  // Desktop or dismissed — render studio normally
  if (!isMobile || dismissed) return <>{children}</>;

  // Mobile and not dismissed — show guard, DO NOT mount studio at all
  return (
    <div className="fixed inset-0 z-[99999] bg-[#041017] flex items-center justify-center p-5">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(#1E3A4A 1px, transparent 1px), linear-gradient(90deg, #1E3A4A 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-[#0C1B24] border border-[#1E3A4A] shadow-2xl p-7 text-center space-y-5">
        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          title="Continue anyway"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon row */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#0D5771]/20 border border-[#0D5771]/40 flex items-center justify-center">
            <Monitor className="w-7 h-7 text-[#3498E3]" />
          </div>
          <ArrowRight className="w-5 h-5 text-slate-600" />
          <div className="w-14 h-14 rounded-2xl bg-rose-900/20 border border-rose-700/40 flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-rose-400" />
          </div>
        </div>

        {/* Heading */}
        <div>
          <h2 className="text-white text-lg font-bold leading-snug">
            Studio works best on a{' '}
            <span className="text-[#3498E3]">Desktop</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            Cuzmify Studio needs a larger screen for the full drag-and-drop experience.
          </p>
        </div>

        {/* Tips card */}
        <div className="bg-[#0D2030] rounded-2xl p-4 space-y-3 text-left">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Two quick options</p>

          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-xl bg-[#0D5771]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#3498E3] text-xs font-black">1</span>
            </div>
            <div>
              <p className="text-white text-sm font-bold">Enable Desktop Mode</p>
              <p className="text-slate-400 text-xs leading-relaxed mt-0.5">
                <strong className="text-slate-300">Chrome:</strong> tap menu (⋮) → <em>Desktop site</em>.{' '}
                <strong className="text-slate-300">Safari:</strong> tap AA → <em>Request Desktop Website</em>.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-xl bg-[#0D5771]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#3498E3] text-xs font-black">2</span>
            </div>
            <div>
              <p className="text-white text-sm font-bold">Use a Laptop or PC</p>
              <p className="text-slate-400 text-xs leading-relaxed mt-0.5">
                Visit <span className="font-mono text-[#3498E3] text-[10px]">cuzmify.com/studio</span> from any desktop browser.
              </p>
            </div>
          </div>
        </div>

        {/* Escape hatch */}
        <button
          onClick={() => setDismissed(true)}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 border border-slate-700 hover:border-slate-500 hover:text-slate-300 transition-all cursor-pointer"
        >
          Continue anyway (limited experience)
        </button>
      </div>
    </div>
  );
}
