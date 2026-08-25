'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Copy, Check, ArrowLeft, X, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function MobileStudioNotice() {
  const [isMobile, setIsMobile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if previously dismissed in this session
    const dismissed = sessionStorage.getItem('cuzmify_mobile_studio_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    const checkViewport = () => {
      const isNarrow = window.innerWidth < 1024;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isNarrow || (isMobileUA && window.innerWidth < 1024));
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('cuzmify_mobile_studio_dismissed', 'true');
    } catch {}
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isMobile) return null;

  // If dismissed, show a sleek mini banner on top so it doesn't block the screen
  if (isDismissed) {
    return (
      <div className="lg:hidden bg-gradient-to-r from-[#0D5771] to-[#083D50] text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-sans shadow-sm z-30 relative">
        <div className="flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-[#3498E3]" />
          <span>For full sidebars &amp; drag-drop, enable <strong>Desktop Site</strong> in browser menu</span>
        </div>
        <button
          onClick={handleCopyLink}
          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold font-mono transition-colors"
        >
          {copied ? '✓ Link Copied' : 'Copy Link'}
        </button>
      </div>
    );
  }

  // Full Screen Advisory Modal for First Mobile Visit
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 lg:hidden animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Visual Graphic Header */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <span className="text-slate-300 font-bold text-xs">➔</span>
          <div className="w-14 h-14 rounded-2xl bg-[#0D5771]/10 border border-[#0D5771]/20 flex items-center justify-center text-[#0D5771] shadow-sm animate-pulse">
            <Monitor className="w-7 h-7" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Desktop Experience Recommended</span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 font-sans">
            Visual Studio Works Best on Laptop &amp; Desktop
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cuzmify Visual Studio features multi-column toolbars, drag-and-drop builders, and real-time element inspectors designed for larger screens.
          </p>
        </div>

        {/* Mobile Browser Tip Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left space-y-1">
          <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <span>💡 Quick Pro Tip:</span>
          </p>
          <p className="text-[11px] text-slate-600 leading-normal">
            Open your browser menu (<strong>⋮</strong> or <strong>Share / aA</strong>) and tap <strong>"Request Desktop Site"</strong> to unlock the full layout right on your phone!
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Studio Link Copied to Clipboard!' : 'Copy Link to Open on Laptop'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            Continue on Mobile Screen Anyway
          </button>

          <Link
            href="/dashboard"
            className="block text-[11px] text-slate-400 hover:text-slate-600 font-medium pt-1"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
