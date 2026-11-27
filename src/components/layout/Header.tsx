'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Layers, Rocket, Sliders, ArrowRight, LogOut, User, ChevronDown, Palette } from 'lucide-react';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';
import { isPlatformHost } from '@/lib/host-routing';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isCreatorLiveDomain =
    typeof window !== 'undefined' && !isPlatformHost(window.location.hostname);

  if (
    pathname === '/studio' ||
    pathname === '/editor' ||
    pathname?.startsWith('/s/') ||
    pathname?.startsWith('/site/') ||
    isCreatorLiveDomain
  ) {
    return null;
  }

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? 'U');

  return (
    <header className="sticky top-0 z-50 pt-2.5 pb-2 px-3 sm:px-6 lg:px-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 bg-[#FFFFFF]/90 backdrop-blur-xl border border-[#E2E8F0]/90 rounded-full px-3.5 sm:px-6 py-2 sm:py-2.5 shadow-[0_8px_30px_rgba(13,87,113,0.06)]">
        {/* Brand Logo — Compact on mobile, never overflows */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0">
          <div className="relative transition-transform duration-300 group-hover:scale-105 shrink-0">
            <CuzmifyLogo className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <div className="leading-none">
            <span className="text-[17px] sm:text-xl font-extrabold tracking-tight text-[#0F172A] font-display block">
              CUZM<span className="text-[#0D5771]">IFY</span>
            </span>
            <span className="hidden sm:block text-[9px] tracking-[0.22em] text-[#64748B] uppercase font-semibold mt-0.5">
              BY BRAM INTEL
            </span>
          </div>
        </Link>

        {/* Desktop Center Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-full border border-[#E2E8F0]">
          {[
            { href: '/#templates', label: 'Styles', icon: Palette },
            { href: '/onboarding', label: 'Create Site', icon: Rocket },
            { href: '/studio', label: 'Studio', icon: Sliders },
            { href: '/dashboard', label: 'My Sites', icon: Layers },
          ].map((item) => {
            const IconComp = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#0D5771] shadow-2xs font-bold border border-[#E2E8F0]'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#FFFFFF]/70'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-[#0D5771]' : 'text-[#64748B]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Balanced Mobile & Desktop Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-[#F1F5F9] animate-pulse" />
          ) : session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-[#E2E8F0] bg-white hover:border-[#0D5771]/30 hover:shadow-2xs transition-all cursor-pointer"
              >
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? ''}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0D5771] to-[#3498E3] flex items-center justify-center text-white font-bold text-xs">
                    {initials}
                  </div>
                )}
                <span className="text-[13px] font-semibold text-[#0F172A] hidden sm:block max-w-[100px] truncate">
                  {user?.name?.split(' ')[0] ?? 'Account'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_12px_36px_rgba(15,23,42,0.10)] py-1.5 z-50 animate-in fade-in duration-150">
                  <div className="px-3.5 py-2.5 border-b border-[#F1F5F9]">
                    <p className="text-[13px] font-bold text-[#0F172A] truncate">{user?.name}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <Layers className="w-4 h-4 text-[#0D5771]" />
                    My Dashboard
                  </Link>
                  <Link
                    href="/studio"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <Sliders className="w-4 h-4 text-[#0D5771]" />
                    Open Studio
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#0D5771]" />
                    Account Settings
                  </Link>
                  <div className="border-t border-[#F1F5F9] mt-1 pt-1">
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: '/' });
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/login"
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[13px] font-semibold text-[#334155] hover:text-[#0D5771] hover:bg-[#F1F5F9] transition-all whitespace-nowrap"
              >
                Log In
              </Link>
              <Link
                href="/onboarding"
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-[#0D5771] to-[#2176AE] hover:opacity-95 text-white font-bold text-xs sm:text-[13px] shadow-sm shadow-[#0D5771]/20 flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0"
              >
                <span>Start Free</span>
                <ArrowRight className="w-3.5 h-3.5 text-white/90" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
