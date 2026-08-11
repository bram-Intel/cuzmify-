import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CUZMIFY_MODULES } from '@/modules/module-registry';
import { Layers, Globe, ShieldCheck, Cpu, ExternalLink, Sparkles, Plus, Key } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#131A29] p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white font-display">Glory Beauty Studio</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">Domain: glorybeauty.cuzmify.com</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/editor"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Customize Design</span>
          </Link>
          <a
            href="https://glorybeauty.cuzmify.com"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20"
          >
            <span>Open Website</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Composable Capabilities Module Manager */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Attached Composable Capabilities
            </h2>
            <p className="text-xs text-slate-400">Attach, detach, replace or extend modules without rebuilding your digital business.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.values(CUZMIFY_MODULES).map((mod) => {
            const isAttached = ['CATALOG', 'BOOKING', 'CART'].includes(mod.type);
            return (
              <GlassCard key={mod.type} className="space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{mod.category}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAttached
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isAttached ? 'ATTACHED' : 'AVAILABLE'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white font-display">{mod.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
                </div>

                <button
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                    isAttached
                      ? 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                      : 'bg-brand-600/20 text-brand-300 border border-brand-500/30 hover:bg-brand-600 hover:text-white'
                  }`}
                >
                  {isAttached ? 'Configure Module' : 'Attach Capability'}
                </button>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Licensing & Security Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white font-display">Cryptographic RSA License State</h3>
          </div>
          <div className="space-y-2 font-mono text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">License Key:</span>
              <span className="text-amber-400 font-bold">CZ-98A1-42FE-7B90</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bound Domain:</span>
              <span>glorybeauty.cuzmify.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Entitlement:</span>
              <span className="text-emerald-400">BeautyPro Studio Suite v1.2.0</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-display">Infrastructure Orchestrator</h3>
          </div>
          <div className="space-y-2 text-xs text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-500">Provider:</span>
              <span>Cuzmify Edge Global CDN</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SSL Certificate:</span>
              <span className="text-emerald-400 font-bold">Active (Let's Encrypt RSA 2048)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Automated Health Check:</span>
              <span className="text-emerald-400">100% Passing</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
