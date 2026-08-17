import React from 'react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { HeroCanvasBackground } from '@/components/ui/HeroCanvasBackground';
import { CUZMIFY_MODULES } from '@/modules/module-registry';
import { Layers, Key, ShieldCheck, ExternalLink, Zap } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A202C] relative overflow-hidden pb-32">
      {/* Background Particle Mesh Canvas */}
      <HeroCanvasBackground />

      {/* Radial Dot Grid Background Mask */}
      <div className="absolute inset-0 bg-[radial-gradient(#0D5771_0.65px,transparent_0.65px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 pt-10 space-y-10 relative z-10">
        {/* Dashboard Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#F7FAFC] p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] font-display">Glory Beauty Studio</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-bold text-xs border border-emerald-500/20 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE • SECURE
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1 font-mono">Domain: glorybeauty.cuzmify.com</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/editor"
              className="px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#1A202C] font-bold text-xs flex items-center gap-2 shadow-sm"
            >
              <Zap className="w-4 h-4 text-[#0D5771]" />
              <span>Customize Design</span>
            </Link>
            <a
              href="https://glorybeauty.cuzmify.com"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#3498E3]/20"
            >
              <span>Open Live Website</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Composable Capabilities Module Manager */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1A202C] font-display flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0D5771]" />
                <span>Attached Composable Capabilities</span>
              </h2>
              <p className="text-xs text-[#64748B]">Attach, detach, replace or extend modules without rebuilding your digital business.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(CUZMIFY_MODULES).map((mod) => {
              const isAttached = ['CATALOG', 'BOOKING', 'CART'].includes(mod.type);
              return (
                <SpotlightCard key={mod.type} className="p-5 rounded-2xl bg-[#FFFFFF] border-[#E2E8F0] space-y-4 flex flex-col justify-between shadow-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">{mod.category}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAttached
                            ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                            : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}
                      >
                        {isAttached ? 'ATTACHED' : 'AVAILABLE'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1A202C] font-display">{mod.name}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{mod.description}</p>
                  </div>

                  <button
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      isAttached
                        ? 'bg-[#FFFFFF] text-[#1A202C] border border-[#E2E8F0] hover:border-slate-300 shadow-sm'
                        : 'bg-[#0D5771] text-white hover:bg-[#083D50]'
                    }`}
                  >
                    {isAttached ? 'Configure Module' : 'Attach Capability'}
                  </button>
                </SpotlightCard>
              );
            })}
          </div>
        </div>

        {/* Licensing & Security Diagnostics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SpotlightCard className="p-6 rounded-2xl bg-[#FFFFFF] border-[#E2E8F0] space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-[#1A202C] font-display">Cryptographic RSA License State</h3>
            </div>
            <div className="space-y-2 font-mono text-xs text-[#1A202C] bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">License Key:</span>
                <span className="text-[#0D5771] font-bold">CZ-98A1-42FE-7B90</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Bound Domain:</span>
                <span>glorybeauty.cuzmify.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Entitlement:</span>
                <span className="text-emerald-700 font-bold">BeautyPro Studio Suite v1.2.0</span>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-6 rounded-2xl bg-[#FFFFFF] border-[#E2E8F0] space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-[#1A202C] font-display">Infrastructure Orchestrator</h3>
            </div>
            <div className="space-y-2 text-xs text-[#1A202C] bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0] font-mono">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Provider:</span>
                <span>Cuzmify Edge Global CDN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">SSL Certificate:</span>
                <span className="text-emerald-700 font-bold">Active (Let's Encrypt RSA 2048)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Automated Health Check:</span>
                <span className="text-emerald-700 font-bold">100% Passing</span>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
