'use client';

import React from 'react';
import { AIThemeConfig, BusinessCategory } from '@/core/types';
import { CURATED_AI_PROMPTS } from '@/services/ai/ai-service';
import { Zap, Palette, Layers, Wand2, RefreshCw, Send, Check } from 'lucide-react';

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
    <div className="bg-[#F7FAFC] p-6 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-6 overflow-y-auto max-h-[85vh] text-[#1A202C] custom-scrollbar" suppressHydrationWarning>
      <div>
        <h2 className="text-lg font-bold text-[#1A202C] flex items-center gap-2 font-display">
          <Wand2 className="w-5 h-5 text-[#0D5771]" />
          <span>AI Visual Control Center</span>
        </h2>
        <p className="text-xs text-[#64748B]">Describe your design vision or choose controls below.</p>
      </div>

      {/* AI Prompt Box */}
      <form onSubmit={handleAiSubmit} className="space-y-3" suppressHydrationWarning>
        <label className="text-xs font-bold text-[#0D5771] uppercase tracking-wider block font-mono">
          Generative AI Design Director
        </label>
        <div className="relative">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. Make it luxury dark obsidian with gold accents..."
            className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl px-4 py-3 text-xs text-[#1A202C] placeholder-slate-400 focus:outline-none focus:border-[#0D5771] focus:ring-2 focus:ring-[#0D5771]/20 shadow-sm pr-10"
            suppressHydrationWarning
          />
          <button
            type="submit"
            disabled={isAiLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white disabled:opacity-50 transition-colors"
            suppressHydrationWarning
          >
            {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>

        {/* 1-Click AI Presets */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
            1-Click Generative Design Presets
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CURATED_AI_PROMPTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={async () => {
                  setAiPrompt(item.prompt);
                  setIsAiLoading(true);
                  try {
                    const res = await fetch('/api/ai/customize', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ currentConfig: config, prompt: item.prompt }),
                    });
                    const data = await res.json();
                    if (data && !data.error) {
                      onChangeConfig(data);
                    }
                  } catch {
                    // silent catch
                  } finally {
                    setIsAiLoading(false);
                  }
                }}
                suppressHydrationWarning
                className="px-2.5 py-1 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#0D5771] hover:text-[#0D5771] text-[11px] font-semibold text-[#1A202C] flex items-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02]"
              >
                <span>{item.label}</span>
                <span className="px-1.5 py-0.2 rounded bg-[#0D5771]/10 text-[#0D5771] font-mono text-[9px] font-bold">
                  {item.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </form>

      <hr className="border-[#E2E8F0]" />

      {/* Business Details */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#0D5771] uppercase tracking-wider flex items-center gap-2 font-mono">
          <Palette className="w-4 h-4 text-[#0D5771]" />
          <span>Business Profile</span>
        </h3>

        <div>
          <label className="text-xs text-[#64748B] font-semibold block mb-1">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => onChangeBusinessName(e.target.value)}
            className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A202C] focus:outline-none focus:border-[#0D5771]"
            suppressHydrationWarning
          />
        </div>

        <div>
          <label className="text-xs text-[#64748B] font-semibold block mb-1">Industry Category</label>
          <select
            value={category}
            onChange={(e) => onChangeCategory(e.target.value as BusinessCategory)}
            className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1A202C] focus:outline-none focus:border-[#0D5771]"
            suppressHydrationWarning
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

      <hr className="border-[#E2E8F0]" />

      {/* Style & Color Theme Controls */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#0D5771] uppercase tracking-wider font-mono">Visual Style Blueprint</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'luxury', label: 'Luxury Gold', color: '#F59E0B' },
            { id: 'dark-elegance', label: 'Dark Obsidian', color: '#071A24' },
            { id: 'minimal', label: 'Clean Slate', color: '#64748B' },
            { id: 'vibrant', label: 'Teal Bloom', color: '#0D5771' },
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
              suppressHydrationWarning
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                config.style === style.id
                  ? 'border-[#0D5771] bg-[#FFFFFF] text-[#0D5771] shadow-sm'
                  : 'border-[#E2E8F0] bg-[#FFFFFF]/60 text-[#64748B] hover:border-slate-300'
              }`}
            >
              <span>{style.label}</span>
              <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: style.color }} />
            </button>
          ))}
        </div>
      </div>

      <hr className="border-[#E2E8F0]" />

      {/* Composable Capabilities Module Switcher */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#0D5771] uppercase tracking-wider flex items-center gap-2 font-mono">
          <Layers className="w-4 h-4 text-[#0D5771]" />
          <span>Composable Capabilities</span>
        </h3>
        <p className="text-[11px] text-[#64748B]">Attach or detach modules without rebuilding site state.</p>

        <div className="space-y-2">
          {[
            { type: 'CATALOG', name: 'Product Catalog' },
            { type: 'CART', name: 'Shopping Cart' },
            { type: 'BOOKING', name: 'Appointment Booking' },
            { type: 'PAYMENTS', name: 'Online Payments' },
          ].map((m) => {
            const isAttached = activeModules.includes(m.type);
            return (
              <button
                key={m.type}
                onClick={() => onToggleModule(m.type)}
                suppressHydrationWarning
                className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  isAttached
                    ? 'border-[#0D5771] bg-[#FFFFFF] text-[#0D5771] font-bold shadow-sm'
                    : 'border-[#E2E8F0] bg-[#FFFFFF]/60 text-[#64748B] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isAttached ? 'bg-[#0D5771] border-[#0D5771] text-white' : 'border-slate-300'
                    }`}
                  >
                    {isAttached && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{m.name}</span>
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold">
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
          suppressHydrationWarning
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#3498E3]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          {isDeploying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Orchestrating Infrastructure...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-white" />
              <span>Launch & Deploy to Cuzmify Cloud</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
