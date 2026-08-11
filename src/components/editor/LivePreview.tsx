'use client';

import React from 'react';
import { AIThemeConfig } from '@/core/types';
import { Smartphone, Monitor, Globe, CheckCircle2, MessageCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface LivePreviewProps {
  config: AIThemeConfig;
  businessName: string;
  category: string;
  activeModules: string[];
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  config,
  businessName,
  category,
  activeModules,
}) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Device Toolbar */}
      <div className="bg-[#131A29] px-6 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Globe className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-slate-300">
            {businessName ? businessName.toLowerCase().replace(/\s+/g, '') : 'glorybeauty'}.cuzmify.com
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold text-[10px] border border-emerald-500/20">
            SSL Verified
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              device === 'desktop' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all ${
              device === 'mobile' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Live Preview Container */}
      <div className="flex-1 bg-slate-900/50 p-4 sm:p-8 overflow-y-auto flex justify-center items-start">
        <div
          className={`transition-all duration-500 shadow-2xl rounded-2xl overflow-hidden border border-slate-800 ${
            device === 'mobile' ? 'w-[375px] min-h-[667px]' : 'w-full max-w-4xl min-h-[600px]'
          }`}
          style={{
            backgroundColor: config.primaryColor || '#0B0F17',
            color: '#FFFFFF',
            fontFamily: config.fontFamily || 'Inter',
          }}
        >
          {/* Header Bar inside Preview */}
          <nav className="px-6 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-black/20">
            <span className="font-bold text-lg font-display tracking-tight" style={{ color: config.secondaryColor }}>
              {businessName || 'Glory Beauty'}
            </span>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
              <span>Services</span>
              <span>Portfolio</span>
              {activeModules.includes('CATALOG') && <span>Catalog</span>}
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-semibold shadow"
                style={{ backgroundColor: config.secondaryColor, color: '#000000' }}
              >
                Book Now
              </button>
            </div>
          </nav>

          {/* Hero Section */}
          <div className="px-8 py-16 text-center space-y-6 relative overflow-hidden">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ backgroundColor: config.secondaryColor }}
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-md border border-white/10 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{category || 'Visual Services'} Specialist</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
              {config.heroHeadline || 'Transforming Elegance & Style'}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
              {config.heroSubheadline || 'Bespoke beauty services tailored for your grandest moments.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                className="px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transition-transform hover:scale-105"
                style={{ backgroundColor: config.secondaryColor, color: '#000000' }}
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button className="px-6 py-3 rounded-xl font-medium text-sm bg-emerald-600/90 text-white flex items-center gap-2 hover:bg-emerald-500 transition-colors">
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp Instant</span>
              </button>
            </div>
          </div>

          {/* Featured Services Section */}
          <div className="px-8 py-12 bg-black/30 border-t border-white/10 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Signature Offerings</h2>
              <p className="text-xs text-slate-400">Discover our most requested bespoke services</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {config.featuredServices?.map((srv, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3 hover:border-amber-400/40 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm">{srv.title}</h3>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded bg-amber-400/20"
                      style={{ color: config.secondaryColor }}
                    >
                      {srv.price}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{srv.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Composable Modules Banner */}
          <div className="px-8 py-6 bg-slate-950/80 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Active Cuzmify Modules ({activeModules.length}): {activeModules.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
