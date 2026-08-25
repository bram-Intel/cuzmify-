'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Copy, Check, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function MobileStudioNotice() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="block lg:hidden">
      {/* 1. If dismissed, show a sleek persistent top banner */}
      {isDismissed ? (
        <aside className="fixed top-0 left-0 w-full z-[999999] bg-gradient-to-r from-[#0D5771] to-[#083D50] text-white px-3 py-2 flex items-center justify-between text-[11px] font-sans shadow-md">
          <div className="flex items-center gap-1.5 flex-1 pr-2">
            <Monitor className="w-3.5 h-3.5 text-[#3498E3] shrink-0" />
            <span className="truncate">For full sidebars &amp; drag-drop, enable <strong>Desktop Site</strong> in browser menu</span>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-bold font-mono transition-colors shrink-0 cursor-pointer"
          >
            {copied ? '✓ Copied' : 'Copy Link'}
          </button>
        </aside>
      ) : (
        /* 2. Full-Screen Modal Advisory for Mobile Screens */
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-studio-title"
          className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4 relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close notice"
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Visual Graphic Header */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-slate-300 font-bold text-xs">➔</span>
              <div className="w-12 h-12 rounded-2xl bg-[#0D5771]/10 border border-[#0D5771]/20 flex items-center justify-center text-[#0D5771] shadow-sm animate-pulse">
                <Monitor className="w-6 h-6" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Desktop Experience Recommended</span>
              </div>
              <h2 id="mobile-studio-title" className="text-base font-extrabold text-slate-900">
                Visual Studio Works Best on Laptop &amp; Desktop
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cuzmify Visual Studio features multi-column toolbars, drag-and-drop builders, and inspectors engineered for larger screens.
              </p>
            </div>

            {/* Mobile Browser Tip Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left space-y-1">
              <p className="text-[11px] font-bold text-slate-700">
                💡 Quick Pro Tip:
              </p>
              <p className="text-[11px] text-slate-600 leading-normal">
                Open your mobile browser menu (<strong>⋮</strong> on Android or <strong>Share / aA</strong> on iPhone) and tap <strong>"Request Desktop Site"</strong> to unlock the full builder layout!
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Studio Link Copied!' : 'Copy Link to Open on Laptop'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Continue on Mobile Screen
              </button>

              <Link
                href="/dashboard"
                className="block text-[11px] text-slate-400 hover:text-slate-600 font-medium pt-0.5"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
