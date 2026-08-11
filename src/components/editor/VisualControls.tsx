'use client';

import React from 'react';
import { AIThemeConfig, BusinessCategory } from '@/core/types';
import { Sparkles, Palette, Layers, Wand2, RefreshCw, Send, Check } from 'lucide-react';

interface VisualControlsProps {
  config: AIThemeConfig;
  onChangeConfig: (newConfig: AIThemeConfig) => void;
  businessName: string;
  onChangeBusinessName: (name: string) => void;
  category: BusinessCategory;
  onChangeCategory: (cat: BusinessCategory) => void;
  activeModules: string[];
  onToggleModule: (moduleType: string) => void;
  onDeploy: () => void;
  isDeploying: boolean;
}

export const VisualControls: React.FC<VisualControlsProps> = ({
  config,
  onChangeConfig,
  businessName,
  onChangeBusinessName,
  category,
  onChangeCategory,
  activeModules,
  onToggleModule,
  onDeploy,
  isDeploying,
}) => {
  const [aiPrompt, setAiPrompt] = React.useState('');
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentConfig: config, prompt: aiPrompt }),
      });
      const data = await res.json();
      if (data && !data.error) {
        onChangeConfig(data);
        setAiPrompt('');
      }
    } catch {
      // error handling
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="bg-[#131A29] p-6 rounded-2xl border border-slate-800 space-y-6 overflow-y-auto max-h-[85vh]">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2 font-display">
          <Wand2 className="w-5 h-5 text-amber-400" />
          AI Visual Control Center
        </h2>
        <p className="text-xs text-slate-400">Describe your design vision or choose controls below.</p>
      </div>

      {/* AI Prompt Box */}
      <form onSubmit={handleAiSubmit} className="space-y-2" suppressHydrationWarning>
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Natural Language Prompt
        </label>
        <div className="relative">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Make it more luxury gold, focus on bridal makeup..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 pr-10"
            suppressHydrationWarning
          />
          <button
            type="submit"
            disabled={isAiLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50"
            suppressHydrationWarning
          >
            {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>

      <hr className="border-slate-800" />

      {/* Business Details */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Palette className="w-4 h-4 text-brand-400" />
          Business Profile
        </h3>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => onChangeBusinessName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            suppressHydrationWarning
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Industry Category</label>
          <select
            value={category}
            onChange={(e) => onChangeCategory(e.target.value as BusinessCategory)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
          >
            <option value="Makeup Artist">Makeup Artist</option>
            <option value="Hairstylist">Hairstylist</option>
            <option value="Event Planner">Event Planner</option>
            <option value="Fashion Designer">Fashion Designer</option>
            <option value="Boutique Seller">Boutique Seller</option>
            <option value="Photographer">Photographer</option>
          </select>
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* Style & Color Theme Controls */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Visual Style Preset</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'luxury', label: 'Luxury Gold', color: '#F59E0B' },
            { id: 'dark-elegance', label: 'Dark Obsidian', color: '#5364F7' },
            { id: 'minimal', label: 'Clean Slate', color: '#64748B' },
            { id: 'vibrant', label: 'Neon Bloom', color: '#EC4899' },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() =>
                onChangeConfig({
                  ...config,
                  style: style.id as any,
                  secondaryColor: style.color,
                })
              }
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                config.style === style.id
                  ? 'border-brand-500 bg-brand-500/10 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>{style.label}</span>
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: style.color }} />
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* Composable Capabilities Module Switcher */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Composable Capabilities
        </h3>
        <p className="text-[11px] text-slate-400">Attach or detach modules without destroying site state.</p>

        <div className="space-y-2">
          {[
            { type: 'CATALOG', name: 'Product Catalog', req: null },
            { type: 'CART', name: 'Shopping Cart', req: 'CATALOG' },
            { type: 'BOOKING', name: 'Appointment Booking', req: null },
            { type: 'PAYMENTS', name: 'Online Payments', req: 'ORDERS' },
          ].map((m) => {
            const isAttached = activeModules.includes(m.type);
            return (
              <button
                key={m.type}
                onClick={() => onToggleModule(m.type)}
                className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  isAttached
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isAttached ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-slate-700'
                    }`}
                  >
                    {isAttached && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{m.name}</span>
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider">
                  {isAttached ? 'Attached' : 'Attach'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deploy Launch CTA */}
      <div className="pt-2">
        <button
          onClick={onDeploy}
          disabled={isDeploying}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
        >
          {isDeploying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Orchestrating Infrastructure...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Launch & Deploy to Cuzmify Cloud</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
