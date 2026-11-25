'use client';

import React from 'react';
import { BorderBeam } from './BorderBeam';
import { CuzmifyLogo } from './CuzmifyLogo';
import {
  Globe,
  CheckCircle2,
  Zap,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  Instagram,
} from 'lucide-react';

export const HeroVisualAccents: React.FC = () => {
  return (
    <div className="relative w-full max-w-md mx-auto xl:max-w-none flex justify-center xl:justify-end [perspective:1400px] pb-8 sm:pb-7">
      {/* Soft Ambient Surface Glow */}
      <div className="absolute -inset-6 sm:-inset-8 bg-gradient-to-tr from-[#3498E3]/20 via-[#0D5771]/15 to-transparent blur-[65px] rounded-full pointer-events-none" />

      {/* Primary 3D Perspective Card Container */}
      <div className="relative w-full max-w-[330px] sm:max-w-sm">
        {/* 1. PRIMARY TRANSFORMATION ENGINE CARD */}
        <div className="relative rounded-3xl bg-[#FFFFFF]/90 backdrop-blur-2xl border border-[#E2E8F0] shadow-[0_4px_12px_rgba(13,87,113,0.04),0_16px_36px_rgba(13,87,113,0.09),0_28px_60px_rgba(13,87,113,0.12)] p-5 sm:p-6 pb-8 sm:pb-8 text-[#0F172A] transition-all duration-700 ease-out xl:[transform:rotateY(-8deg)_rotateX(3deg)] hover:[transform:rotateY(-2deg)_rotateX(1deg)] hover:scale-[1.01] overflow-hidden group z-10">
          <BorderBeam size={160} duration={9} colorFrom="#0D5771" colorTo="#3498E3" />

          {/* Header with Official Trademark Emblem */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0]/80 pb-3 relative z-10">
            <div className="flex items-center gap-2">
              <CuzmifyLogo className="w-5 h-5 rounded-lg shadow-2xs" />
              <span className="text-[11px] font-mono font-bold text-[#0D5771] tracking-wider uppercase">
                HOW CUZMIFY WORKS
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-mono font-bold border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Visual Story */}
          <div className="py-3.5 space-y-3 relative z-10">
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#64748B]">
                <span>YOUR EXISTING CONTENT</span>
                <span className="text-pink-600 flex items-center gap-1">
                  <Instagram className="w-3 h-3" /> @glorybeauty
                </span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-[#0F172A] font-semibold">
                <div className="w-2 h-2 rounded-full bg-[#3498E3] shrink-0" />
                <span>Instagram Posts, Reels &amp; Rates</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 py-0.5 text-[10px] font-mono font-bold text-[#0D5771]">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#0D5771]/40" />
              <span className="px-3 py-1 rounded-full bg-[#0D5771]/8 border border-[#0D5771]/20 flex items-center gap-1 text-[10px]">
                <Zap className="w-3 h-3 text-[#3498E3]" />
                <span>CUZMIFY ENGINE</span>
              </span>
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#0D5771]/40" />
            </div>

            <div className="p-3.5 rounded-2xl bg-[#071A24] text-white border border-[#1E3A4A] space-y-2 shadow-inner">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-100 truncate">
                  <Globe className="w-3.5 h-3.5 text-[#72B9F3] shrink-0" />
                  <span className="truncate">glorybeauty.com</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  SSL LIVE
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span>Portfolio + Packages + Booking</span>
                <span className="text-amber-300 font-mono text-[11px] font-bold">3 Mins</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#E2E8F0]/80 flex items-center justify-between text-[11px] text-[#475569] relative z-10">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Zero Coding Required
            </span>
            <span className="text-[#0D5771] font-bold flex items-center gap-1">
              <span>Switch Styles Anytime</span>
              <ArrowRight className="w-3 h-3 text-[#3498E3]" />
            </span>
          </div>
        </div>

        {/* 2. SECONDARY SATELLITE BADGE — Framed cleanly below footer text */}
        <div className="absolute left-3 sm:-left-8 -bottom-6 z-20 w-56 rounded-2xl bg-[#FFFFFF]/98 backdrop-blur-2xl border border-[#E2E8F0] shadow-[0_14px_32px_rgba(13,87,113,0.16)] p-3 text-[#0F172A] transition-transform duration-500 hover:scale-105 animate-float pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#0F172A] font-display flex items-center gap-1.5">
                  <span className="truncate">WhatsApp Enquiry</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
                <div className="text-[10px] text-[#64748B] font-medium truncate">Bridal Glam • Sat 14 Dec</div>
              </div>
            </div>
            <div className="px-2 py-0.5 rounded-md bg-[#0D5771]/10 text-[#0D5771] text-[9px] font-mono font-bold shrink-0">
              NEW
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
