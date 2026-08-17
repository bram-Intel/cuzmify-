'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Cpu, ChevronUp, ShoppingBag, Globe, Sliders, Layers } from 'lucide-react';
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

      if (documentHeight <= windowHeight + 50 || windowHeight + scrollTop >= documentHeight - 150) {
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

  if (pathname === '/studio' || pathname === '/editor') {
    return null;
  }

  return (
    <footer className="relative mt-20 z-40">
      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out pb-1 ${
          isAtBottom ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
          className={`bg-[#FFFFFF]/95 backdrop-blur-2xl border border-[#E2E8F0] border-b-0 shadow-[0_-10px_35px_rgba(13,87,113,0.14)] transition-all duration-500 ease-out origin-bottom ${
            isExpanded
              ? 'w-[95vw] max-w-5xl rounded-t-3xl p-6 sm:p-8'
              : 'w-auto rounded-t-xl px-5 py-1.5 cursor-pointer'
          }`}
          suppressHydrationWarning
        >
          {/* Minimized Ultra-Slim Status Pill */}
          <div className="flex items-center justify-between gap-4 text-xs font-semibold text-[#1A202C]">
            <div className="flex items-center gap-2.5">
              <CuzmifyLogo className="w-5 h-5 flex-shrink-0" />
              <span className="font-extrabold text-xs tracking-tight font-display">CUZMIFY</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-mono text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                v3.0 LIVE
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#0D5771] font-mono text-[11px] font-bold">
              <Cpu className="w-3.5 h-3.5 text-[#3498E3]" />
              <span>{isExpanded ? 'Bram Intel Composable OS' : 'Hover to expand platform navigation'}</span>
              <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-[#3498E3]' : 'animate-bounce text-[#0D5771]'}`} />
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="pt-6 mt-6 border-t border-[#E2E8F0] space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs sm:text-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CuzmifyLogo className="w-6 h-6 flex-shrink-0" />
                    <h4 className="text-xs font-extrabold text-[#1A202C] uppercase tracking-wider font-display">About Platform</h4>
                  </div>
                  <p className="text-[#64748B] leading-relaxed text-xs">
                    A composable digital-business marketplace, AI customization engine & deployment platform. Turn any business idea into a live digital home.
                  </p>
                  <div className="text-xs text-[#0D5771] font-mono font-bold">
                    Powered by Bram Intel OS
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-[#1A202C] uppercase tracking-wider font-display">Mantra Steps</h4>
                  <ul className="space-y-2 text-[#64748B] text-xs">
                    <li className="flex items-center gap-2"><span className="text-[#0D5771] font-bold font-mono">01.</span> Choose It</li>
                    <li className="flex items-center gap-2"><span className="text-[#0D5771] font-bold font-mono">02.</span> Import It</li>
                    <li className="flex items-center gap-2"><span className="text-[#3498E3] font-bold font-mono">03.</span> Cuzmify It</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold font-mono">04.</span> Launch It</li>
                    <li className="flex items-center gap-2"><span className="text-indigo-600 font-bold font-mono">05.</span> Extend It</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-[#1A202C] uppercase tracking-wider font-display">Navigation</h4>
                  <ul className="space-y-2.5 text-[#64748B] text-xs font-medium">
                    <li><Link href="/marketplace" className="hover:text-[#0D5771] flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-[#0D5771]" /> Marketplace</Link></li>
                    <li><Link href="/importer" className="hover:text-[#0D5771] flex items-center gap-2"><Globe className="w-4 h-4 text-[#0D5771]" /> Revamp Importer</Link></li>
                    <li><Link href="/studio" className="hover:text-[#0D5771] flex items-center gap-2"><Sliders className="w-4 h-4 text-[#0D5771]" /> Visual Studio</Link></li>
                    <li><Link href="/dashboard" className="hover:text-[#0D5771] flex items-center gap-2"><Layers className="w-4 h-4 text-[#0D5771]" /> Dashboard</Link></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-[#1A202C] uppercase tracking-wider font-display">Security & Trust</h4>
                  <div className="bg-[#F7FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center gap-2 font-bold text-[#0D5771] text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>RSA 2048 Signed</span>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Signed license keys protect developer IP and guarantee authentic cloud deployments.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-3">
                <div>© 2026 Cuzmify. Bram Intel OS. All rights reserved. Version 3.0</div>
                <div className="flex gap-6 font-medium">
                  <Link href="#" className="hover:text-[#1A202C]">Privacy Policy</Link>
                  <Link href="#" className="hover:text-[#1A202C]">Terms of Service</Link>
                  <Link href="#" className="hover:text-[#1A202C]">Infrastructure SLA</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
