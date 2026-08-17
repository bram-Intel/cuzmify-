'use client';

import React from 'react';
import { BorderBeam } from './BorderBeam';
import { CuzmifyLogo } from './CuzmifyLogo';
import {
  Globe,
  CheckCircle2,
  Zap,
  Box,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

export const HeroVisualAccents: React.FC = () => {
  return (
    <div className="relative w-full max-w-sm mx-auto xl:max-w-none flex justify-center xl:justify-end [perspective:1400px]">
      {/* Soft Ambient Surface Glow */}
      <div className="absolute -inset-8 bg-gradient-to-tr from-[#3498E3]/20 via-[#0D5771]/15 to-transparent blur-[70px] rounded-full pointer-events-none" />

      {/* Primary 3D Perspective Card Container */}
      <div className="relative w-full max-w-xs sm:max-w-sm">
        {/* 1. PRIMARY TRANSFORMATION ENGINE CARD */}
        <div className="relative rounded-3xl bg-[#FFFFFF]/80 backdrop-blur-2xl border border-white/80 shadow-[0_4px_12px_rgba(13,87,113,0.04),0_12px_28px_rgba(13,87,113,0.08),0_24px_55px_rgba(13,87,113,0.12)] p-5 text-[#1A202C] transition-all duration-700 ease-out xl:[transform:rotateY(-10deg)_rotateX(4deg)] hover:[transform:rotateY(-2deg)_rotateX(1deg)] hover:scale-[1.02] overflow-hidden group z-10">
          <BorderBeam size={150} duration={9} colorFrom="#0D5771" colorTo="#3498E3" />

          {/* Header with Official Trademark Emblem */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0]/80 pb-2.5 relative z-10">
            <div className="flex items-center gap-2">
              <CuzmifyLogo className="w-5 h-5 rounded-lg shadow-sm" />
              <span className="text-[11px] font-mono font-bold text-[#0D5771] tracking-wider uppercase">
                WHAT YOU GET
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[9px] font-mono font-bold border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          </div>

          {/* Visual Story */}
          <div className="py-3 space-y-2.5 relative z-10">
            <div className="p-3 rounded-2xl bg-[#F7FAFC]/80 border border-[#E2E8F0] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#64748B]">
                <span>YOUR EXISTING BUSINESS</span>
                <span className="text-[#0D5771]">Socials & Photos</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#1A202C] font-semibold">
                <div className="w-2 h-2 rounded-full bg-[#3498E3]" />
                <span>Instagram, WhatsApp & Pictures</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 py-0.5 text-[10px] font-mono font-bold text-[#0D5771]">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#0D5771]/40" />
              <span className="px-2.5 py-0.5 rounded-full bg-[#0D5771]/10 border border-[#0D5771]/20 flex items-center gap-1 text-[9px]">
                <Zap className="w-3 h-3 text-[#3498E3]" />
                <span>CUZMIFY ENGINE</span>
              </span>
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#0D5771]/40" />
            </div>

            <div className="p-3 rounded-2xl bg-[#071A24]/90 text-white border border-[#1E3A4A] space-y-1.5 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-200">
                  <Globe className="w-3.5 h-3.5 text-[#72B9F3]" />
                  <span>glorybeauty.com</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  SECURE & LIVE
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-medium">
                <span>Catalog + Booking Included</span>
                <span className="text-amber-400 font-mono font-bold">Ready Now</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2.5 border-t border-[#E2E8F0]/80 flex items-center justify-between text-[10px] font-mono text-[#64748B] relative z-10">
            <span className="flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              No Coding Required
            </span>
            <span className="text-[#0D5771] font-bold flex items-center gap-0.5">
              <span>One Sitting</span>
              <ArrowRight className="w-3 h-3 text-[#3498E3]" />
            </span>
          </div>
        </div>

        {/* 2. SECONDARY SATELLITE BADGE */}
        <div className="absolute -left-10 sm:-left-12 -bottom-4 z-20 w-48 sm:w-52 rounded-2xl bg-[#FFFFFF]/95 backdrop-blur-2xl border border-[#E2E8F0] shadow-[0_12px_30px_rgba(13,87,113,0.14)] p-3 text-[#1A202C] transition-transform duration-500 hover:scale-105 animate-float pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[#1A202C] font-display flex items-center gap-1">
                  <span>WhatsApp Booking</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[9px] text-[#64748B] font-mono">New Appointment!</div>
              </div>
            </div>
            <div className="px-2 py-0.5 rounded-md bg-[#0D5771]/8 text-[#0D5771] text-[9px] font-mono font-bold">
              INSTANT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
