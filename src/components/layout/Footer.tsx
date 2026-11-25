'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, ChevronUp, Sliders, Layers, Rocket } from 'lucide-react';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      if (documentHeight <= windowHeight + 50 || windowHeight + scrollTop >= documentHeight - 160) {
        setIsAtBottom(true);
      } else {
        setIsAtBottom(false);
        setIsExpanded(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isSubdomain =
    typeof window !== 'undefined' &&
    ((window.location.hostname.includes('.localhost') && !window.location.hostname.startsWith('localhost')) ||
      (window.location.hostname.includes('.cuzmify.') &&
        !window.location.hostname.startsWith('www.') &&
        !window.location.hostname.startsWith('app.')));

  if (
    pathname === '/studio' ||
    pathname === '/editor' ||
    pathname?.startsWith('/s/') ||
    pathname?.startsWith('/site/') ||
    isSubdomain
  ) {
    return null;
  }

  return (
    <footer className="relative mt-16 z-40">
      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
          isAtBottom ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div
          onMouseEnter={() => {
            if (typeof window !== 'undefined' && window.innerWidth >= 768) setIsExpanded(true);
          }}
          onMouseLeave={() => {
            if (typeof window !== 'undefined' && window.innerWidth >= 768) setIsExpanded(false);
          }}
          className={`bg-[#FFFFFF]/96 backdrop-blur-2xl border border-[#E2E8F0] border-b-0 shadow-[0_-12px_40px_rgba(13,87,113,0.12)] transition-all duration-300 ease-out origin-bottom ${
            isExpanded
              ? 'w-[94vw] max-w-5xl rounded-t-3xl p-5 sm:p-8 max-h-[80vh] overflow-y-auto'
              : 'w-auto max-w-[92vw] rounded-t-2xl px-4 sm:px-5 py-2 cursor-pointer'
          }`}
          suppressHydrationWarning
        >
          {/* Collapsed Single-Line Bar — Zero Mobile Wrapping */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between gap-4 sm:gap-6 text-xs font-semibold text-[#0F172A] whitespace-nowrap cursor-pointer"
          >
            <div className="flex items-center gap-2 shrink-0">
              <CuzmifyLogo className="w-5 h-5 shrink-0" />
              <span className="font-extrabold text-[13px] tracking-tight font-display">
                CUZM<span className="text-[#0D5771]">IFY</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[#0D5771] text-xs font-semibold shrink-0">
              <span className="hidden sm:inline">{isExpanded ? 'Close Navigation' : 'Explore Platform'}</span>
              <span className="sm:hidden">{isExpanded ? 'Close' : 'Platform Menu'}</span>
              <ChevronUp
                className={`w-4 h-4 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180 text-[#3498E3]' : 'text-[#0D5771]'
                }`}
              />
            </div>
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="pt-5 mt-4 border-t border-[#E2E8F0] space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-sm">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <CuzmifyLogo className="w-5 h-5 shrink-0" />
                    <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider font-display">
                      Cuzmify
                    </h4>
                  </div>
                  <p className="text-[#475569] leading-relaxed text-[13px]">
                    Turn your Instagram into a fast, professional portfolio and booking website—right from your phone.
                  </p>
                  <p className="text-xs text-[#0D5771] font-semibold">By Bram Intel</p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider font-display">
                    How It Works
                  </h4>
                  <ul className="space-y-2 text-[#475569] text-[13px]">
                    <li className="flex items-center gap-2">
                      <span className="text-[#0D5771] font-bold font-mono text-xs">01</span> Connect Instagram
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#0D5771] font-bold font-mono text-xs">02</span> Set Packages &amp; Style
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-[#0D5771] font-bold font-mono text-xs">03</span> Publish &amp; Receive Bookings
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider font-display">
                    Platform
                  </h4>
                  <ul className="space-y-2 text-[#475569] text-[13px] font-medium">
                    <li>
                      <Link href="/onboarding" onClick={() => setIsExpanded(false)} className="hover:text-[#0D5771] flex items-center gap-2">
                        <Rocket className="w-3.5 h-3.5 text-[#0D5771]" /> Create Free Website
                      </Link>
                    </li>
                    <li>
                      <Link href="/studio" onClick={() => setIsExpanded(false)} className="hover:text-[#0D5771] flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-[#0D5771]" /> Open Studio
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard" onClick={() => setIsExpanded(false)} className="hover:text-[#0D5771] flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-[#0D5771]" /> My Dashboard
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider font-display">
                    Trust &amp; Security
                  </h4>
                  <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-[#0D5771] text-[13px]">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Official OAuth &amp; SSL</span>
                    </div>
                    <p className="text-xs text-[#475569] leading-relaxed">
                      Read-only Instagram import, automatic HTTPS on custom domains, and zero booking commissions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
                <div>© {new Date().getFullYear()} Cuzmify by Bram Intel. All rights reserved.</div>
                <div className="flex items-center gap-5 font-medium">
                  <Link href="/privacy" onClick={() => setIsExpanded(false)} className="hover:text-[#0F172A]">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" onClick={() => setIsExpanded(false)} className="hover:text-[#0F172A]">
                    Terms
                  </Link>
                  <Link href="/data-deletion" onClick={() => setIsExpanded(false)} className="hover:text-[#0F172A]">
                    Data Deletion
                  </Link>
                  <Link href="/#pricing" onClick={() => setIsExpanded(false)} className="hover:text-[#0F172A]">
                    Pricing
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
