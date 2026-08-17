'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Layers, ShoppingBag, Globe, Rocket, Sliders, ArrowUpRight, LogOut, User, ChevronDown } from 'lucide-react';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (pathname === '/studio' || pathname === '/editor') {
    return null;
  }

  const user = session?.user;
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <header className="sticky top-0 z-50 py-3 px-4 sm:px-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-[#FFFFFF]/85 backdrop-blur-xl border border-[#E2E8F0] rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative transition-transform duration-300 group-hover:scale-105">
            <CuzmifyLogo className="w-10 h-10 flex-shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-[#1A202C] font-display">
                CUZM<span className="text-[#0D5771]">IFY</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-mono text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                v3.0
              </span>
            </div>
            <span className="block text-[9px] tracking-[0.2em] text-[#0D5771] uppercase font-bold font-mono">
              BY BRAM INTEL
            </span>
          </div>
        </Link>

        {/* Floating Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F7FAFC] p-1.5 rounded-full border border-[#E2E8F0]">
          {[
            { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
            { href: '/importer', label: 'Revamp Website', icon: Globe },
            { href: '/studio', label: 'Visual Studio', icon: Sliders },
            { href: '/dashboard', label: 'My Dashboard', icon: Layers },
          ].map((item) => {
            const IconComp = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#0D5771] shadow-sm font-bold border border-[#E2E8F0]'
                    : 'text-[#64748B] hover:text-[#1A202C] hover:bg-[#FFFFFF]/60'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-[#0D5771]' : 'text-[#64748B]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side: CTA or Avatar */}
        <div className="flex items-center gap-3">
          {status === 'loading' ? (
            <div className="w-9 h-9 rounded-full bg-[#F1F5F9] animate-pulse" />
          ) : session ? (
            // ── LOGGED IN: Avatar Dropdown ──────────────────────────────────
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-[#E2E8F0] bg-white hover:border-[#0D5771]/30 hover:shadow-sm transition-all"
              >
                {user?.image ? (
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
                <span className="text-xs font-semibold text-[#1A202C] hidden sm:block max-w-[100px] truncate">
                  {user?.name?.split(' ')[0] ?? 'Account'}
                </span>
                <ChevronDown className={`w-3 h-3 text-[#64748B] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_8px_30px_rgba(0,0,0,0.08)] py-1.5 z-50 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-[#F1F5F9]">
                    <p className="text-xs font-bold text-[#1A202C] truncate">{user?.name}</p>
                    <p className="text-[10px] text-[#64748B] truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A202C] hover:bg-[#F7FAFC] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#0D5771]" />
                    My Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1A202C] hover:bg-[#F7FAFC] transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#0D5771]" />
                    My Dashboard
                  </Link>
                  <div className="border-t border-[#F1F5F9] mt-1 pt-1">
                    <button
                      onClick={() => { signOut({ callbackUrl: '/' }); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // ── LOGGED OUT: Log In + Start Project CTAs ───────────────────
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold text-[#1A202C] hover:text-[#0D5771] hover:bg-[#F1F5F9] transition-all"
              >
                Log In
              </Link>
              <Link
                href="/onboarding"
                className="group relative px-4 sm:px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0D5771] via-[#083D50] to-[#3498E3] text-white font-bold text-xs shadow-md shadow-[#3498E3]/20 flex items-center gap-1.5 sm:gap-2 transition-all duration-300 hover:scale-[1.03] overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Rocket className="w-3.5 h-3.5 text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                <span className="relative z-10">Start Project</span>
                <ArrowUpRight className="w-3 h-3 text-slate-200 opacity-70 group-hover:opacity-100 transition-opacity hidden sm:inline" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
