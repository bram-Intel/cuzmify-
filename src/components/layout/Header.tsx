'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Layers, ShoppingBag, Terminal, Globe, Rocket } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-amber-400 p-[1.5px]">
            <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white font-display">
              CUZMIFY
            </span>
            <span className="block text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
              by Bram Intel
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/marketplace" className="hover:text-white flex items-center gap-2 transition-colors">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            Marketplace
          </Link>
          <Link href="/importer" className="hover:text-white flex items-center gap-2 transition-colors">
            <Globe className="w-4 h-4 text-brand-400" />
            Revamp Website
          </Link>
          <Link href="/editor" className="hover:text-white flex items-center gap-2 transition-colors">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            AI Editor
          </Link>
          <Link href="/dashboard" className="hover:text-white flex items-center gap-2 transition-colors">
            <Layers className="w-4 h-4 text-emerald-400" />
            My Dashboard
          </Link>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <Link
            href="/editor"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all duration-200 hover:scale-[1.02]"
          >
            <Rocket className="w-4 h-4" />
            Start Cuzmifying
          </Link>
        </div>
      </div>
    </header>
  );
};
