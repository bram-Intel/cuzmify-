'use client';

import React from 'react';
import { MousePointer2, Type, Image, Square, Star, Layout, ExternalLink, Phone, Palette, X, Sparkles, Wand2, Zap, Crown, MessageSquare, ChevronDown } from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import { DESIGN_TOKENS } from './theme/DesignTokens';
import { AIEngine } from './ai/AIEngine';
import type { ThemeName } from '@/core/project-schema';

// ── No selection state ─────────────────────────────────────────────────────

function NoSelectionPanel() {
  const { theme, handleThemeChange } = useEditor();

  const THEMES: { id: ThemeName; label: string; emoji: string }[] = [
    { id: 'bram-light', label: 'Bram Light', emoji: '💎' },
    { id: 'luxury', label: 'Luxury', emoji: '✨' },
    { id: 'dark-obsidian', label: 'Dark Obsidian', emoji: '🖤' },
    { id: 'editorial', label: 'Editorial', emoji: '📰' },
    { id: 'minimal', label: 'Minimal', emoji: '⬜' },
    { id: 'modern', label: 'Modern', emoji: '🔵' },
    { id: 'vibrant', label: 'Vibrant', emoji: '💗' },
    { id: 'apple-luxury', label: 'Apple Luxury', emoji: '🍏' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#0D5771] mb-1.5 px-1 font-mono">
          SELECT AN ELEMENT
        </p>
        <div className="flex items-start gap-3 px-3.5 py-3.5 rounded-xl bg-[#F7FAFC] border border-[#E2E8F0] shadow-sm">
          <MousePointer2 className="w-4 h-4 text-[#0D5771] mt-0.5 shrink-0" />
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Click any element on your website canvas to select it and inspect design properties here.
          </p>
        </div>
      </div>

      <div className="h-px bg-[#E2E8F0]" />

      {/* Global theme switcher */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#0D5771] font-mono flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-[#0D5771]" /> DESIGN THEMES
          </p>
          <span className="text-[9px] text-[#94A3B8] font-mono">10 Curated</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => {
            const tok = DESIGN_TOKENS[t.id];
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#0D5771] bg-[#0D5771]/10 text-[#0D5771] font-bold shadow-sm'
                    : 'border-[#E2E8F0] bg-[#F7FAFC] hover:border-[#0D5771]/40 text-[#64748B] hover:text-[#1A202C]'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full shrink-0 border border-slate-300 shadow-sm"
                  style={{ background: tok.colorSecondary }}
                />
                <span className="text-[10px] font-bold truncate">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Hero panel ─────────────────────────────────────────────────────────────

function HeroPanel() {
  const { service } = useEditor();
  const traits = service?.getSelectedComponentTraits() ?? {};

  return (
    <div className="space-y-4">
      <SectionHeader icon={<Layout className="w-4 h-4" />} title="Hero Section" badge="Hero" />

      <TraitGroup title="Headline & Text">
        <TraitInput label="Headline" value={traits['data-headline'] ?? ''} onChange={(v) => service?.updateSelectedTrait('data-headline', v)} />
        <TraitInput label="Subtitle" value={traits['data-subheadline'] ?? ''} onChange={(v) => service?.updateSelectedTrait('data-subheadline', v)} multiline />
        <TraitInput label="CTA Button Text" value={traits['data-cta-text'] ?? 'Book Session'} onChange={(v) => service?.updateSelectedTrait('data-cta-text', v)} />
      </TraitGroup>

      <TraitGroup title="Media Asset">
        <TraitInput label="Hero Image URL" value={traits['data-image-url'] ?? ''} onChange={(v) => service?.updateSelectedTrait('data-image-url', v)} placeholder="https://images.unsplash.com/..." />
      </TraitGroup>
    </div>
  );
}

// ── Text panel ─────────────────────────────────────────────────────────────

function AIRewriteBlock() {
  const { service } = useEditor();
  const [customPrompt, setCustomPrompt] = React.useState('');
  const [showCustom, setShowCustom] = React.useState(false);
  const [variations, setVariations] = React.useState<string[] | null>(null);
  const [lastAction, setLastAction] = React.useState<string | null>(null);

  const handleAIRewrite = async (action: 'polish' | 'punchy' | 'tone_luxury' | 'whatsapp_hook' | 'variations' | 'custom') => {
    if (!service) return;
    const text = service.getSelectedText();
    if (!text) return;

    try {
      if (action === 'variations') {
        const res = await AIEngine.rewriteInlineTextAsync(text, 'variations');
        setVariations(res.variations || null);
        return;
      }

      const res = await AIEngine.rewriteInlineTextAsync(text, action, customPrompt);
      service.updateSelectedText(res.transformed);
      setLastAction(res.action);
      setShowCustom(false);
      setVariations(null);
      setTimeout(() => setLastAction(null), 2200);
    } catch (err) {
      console.error('[AIRewriteBlock] Error:', err);
    }
  };

  const handleApplyVariation = (vText: string) => {
    if (!service) return;
    const clean = vText.replace(/^[^\w]+Option\s*\d+\s*\([^)]+\):\s*/i, '').trim();
    service.updateSelectedText(clean);
    setVariations(null);
    setLastAction('Applied Variation');
    setTimeout(() => setLastAction(null), 2200);
  };

  return (
    <div className="p-3 rounded-2xl bg-[#0D5771]/5 border border-[#0D5771]/15 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#0D5771]">
          <Sparkles className="w-3.5 h-3.5 text-[#0D5771] animate-pulse" />
          <span>AI REWRITE ASSISTANT</span>
        </div>
        {lastAction && (
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            ✓ {lastAction}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => handleAIRewrite('polish')}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[11px] font-semibold text-[#1A202C] hover:text-[#0D5771] transition-all shadow-2xs cursor-pointer"
        >
          <Wand2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Polish</span>
        </button>
        <button
          onClick={() => handleAIRewrite('punchy')}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[11px] font-semibold text-[#1A202C] hover:text-[#0D5771] transition-all shadow-2xs cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Punchy</span>
        </button>
        <button
          onClick={() => handleAIRewrite('tone_luxury')}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[11px] font-semibold text-[#1A202C] hover:text-[#0D5771] transition-all shadow-2xs cursor-pointer"
        >
          <Crown className="w-3.5 h-3.5 text-yellow-500" />
          <span>Luxury</span>
        </button>
        <button
          onClick={() => handleAIRewrite('whatsapp_hook')}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[11px] font-semibold text-[#1A202C] hover:text-[#0D5771] transition-all shadow-2xs cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-green-600" />
          <span>WhatsApp</span>
        </button>
      </div>

      <div className="flex gap-1.5 pt-1 border-t border-[#0D5771]/10">
        <button
          onClick={() => handleAIRewrite('variations')}
          className="flex-1 py-1.5 px-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[10px] font-bold text-[#64748B] hover:text-[#0D5771] transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>3 Variations</span>
          <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
        </button>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="py-1.5 px-3 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white text-[10px] font-extrabold transition-all cursor-pointer"
        >
          Ask AI…
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-1 pt-1 animate-in fade-in duration-150">
          <input
            type="text"
            id="panel-ai-custom-prompt"
            name="panelAiCustomPrompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAIRewrite('custom');
            }}
            placeholder="e.g. 'translate to French', 'make friendly'…"
            className="flex-1 bg-white border border-[#E2E8F0] focus:border-[#0D5771] rounded-lg px-2 py-1 text-[11px] text-[#1A202C] outline-none"
            suppressHydrationWarning
          />
          <button
            onClick={() => handleAIRewrite('custom')}
            disabled={!customPrompt.trim()}
            className="px-2 py-1 bg-[#0D5771] hover:bg-[#083D50] disabled:opacity-40 text-white rounded-lg text-[10px] font-bold cursor-pointer"
          >
            Run
          </button>
        </div>
      )}

      {variations && (
        <div className="space-y-1 pt-1.5 border-t border-[#0D5771]/10 animate-in fade-in duration-150">
          <span className="text-[9px] font-mono font-bold text-[#0D5771]">CLICK TO APPLY:</span>
          {variations.map((v, i) => (
            <button
              key={i}
              onClick={() => handleApplyVariation(v)}
              className="w-full text-left p-2 rounded-lg bg-white hover:bg-[#0D5771]/10 border border-[#E2E8F0] text-[10px] text-[#1A202C] leading-snug transition-all cursor-pointer font-normal"
            >
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Text panel ─────────────────────────────────────────────────────────────

export const FONT_FAMILIES = [
  { label: 'Playfair Display (Luxury Serif)', value: "'Playfair Display', serif" },
  { label: 'Cormorant Garamond (Haute Couture)', value: "'Cormorant Garamond', serif" },
  { label: 'Plus Jakarta Sans (Modern Sans)', value: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Outfit (Geometric Display)', value: "'Outfit', sans-serif" },
  { label: 'Cinzel (Royal Roman Serif)', value: "'Cinzel', serif" },
  { label: 'Syne (Avant-Garde High Fashion)', value: "'Syne', sans-serif" },
  { label: 'Bodoni Moda (Vogue Italian Serif)', value: "'Bodoni Moda', serif" },
  { label: 'Inter (Crisp Minimal UI)', value: "'Inter', sans-serif" },
  { label: 'Space Grotesk (Tech Brutalist)', value: "'Space Grotesk', sans-serif" },
  { label: 'Montserrat (Bold Display)', value: "'Montserrat', sans-serif" },
  { label: 'DM Sans (Humanist Editorial)', value: "'DM Sans', sans-serif" },
  { label: 'Inherit Theme Font', value: 'inherit' },
];

function TextPanel() {
  const { service } = useEditor();

  return (
    <div className="space-y-4">
      <SectionHeader icon={<Type className="w-4 h-4" />} title="Dynamic Typography" badge="Typography" />

      {/* AI Assistant */}
      <AIRewriteBlock />

      <TraitGroup title="Font & Style">
        <StyleInput
          label="Font Family"
          prop="font-family"
          defaultValue="'Plus Jakarta Sans', sans-serif"
          type="select"
          options={FONT_FAMILIES}
          service={service}
        />
        <StyleInput
          label="Font Size"
          prop="font-size"
          defaultValue="16px"
          service={service}
        />
        <StyleInput
          label="Font Weight"
          prop="font-weight"
          defaultValue="400"
          type="select"
          options={['300', '400', '500', '600', '700', '800', '900']}
          service={service}
        />
        <StyleInput
          label="Text Transform"
          prop="text-transform"
          defaultValue="none"
          type="select"
          options={['none', 'uppercase', 'capitalize', 'lowercase']}
          service={service}
        />
        <StyleInput
          label="Letter Spacing"
          prop="letter-spacing"
          defaultValue="0em"
          type="select"
          options={['-0.05em', '0em', '0.02em', '0.05em', '0.1em', '0.15em', '0.25em']}
          service={service}
        />
        <StyleInput
          label="Line Height"
          prop="line-height"
          defaultValue="1.6"
          type="select"
          options={['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.75', '2.0']}
          service={service}
        />
        <StyleInput
          label="Text Color"
          prop="color"
          defaultValue="#1A202C"
          type="color"
          service={service}
        />
      </TraitGroup>

      <TraitGroup title="Alignment">
        <AlignmentButtons service={service} />
      </TraitGroup>
    </div>
  );
}

// ── Image panel ─────────────────────────────────────────────────────────────

function ImagePanel() {
  const { service } = useEditor();

  return (
    <div className="space-y-4">
      <SectionHeader icon={<Image className="w-4 h-4" />} title="Image Element" badge="Image" />

      <TraitGroup title="Source">
        <p className="text-[10px] text-[#64748B] leading-relaxed">
          Double-click the image on canvas to replace it directly.
        </p>
      </TraitGroup>

      <TraitGroup title="Layout & Fit">
        <StyleInput label="Object Fit" prop="object-fit" defaultValue="cover" type="select"
          options={['cover', 'contain', 'fill', 'none', 'scale-down']} service={service} />
        <StyleInput label="Border Radius" prop="border-radius" defaultValue="0px" service={service} />
        <StyleInput label="Width" prop="width" defaultValue="100%" service={service} />
        <StyleInput label="Height" prop="height" defaultValue="auto" service={service} />
      </TraitGroup>
    </div>
  );
}

// ── Button panel ───────────────────────────────────────────────────────────

function ButtonPanel() {
  const { service } = useEditor();

  return (
    <div className="space-y-4">
      <SectionHeader icon={<Square className="w-4 h-4" />} title="Button Element" badge="Button" />

      {/* AI Assistant for Button Copy */}
      <AIRewriteBlock />

      <TraitGroup title="Typography">
        <StyleInput
          label="Font Family"
          prop="font-family"
          defaultValue="'Plus Jakarta Sans', sans-serif"
          type="select"
          options={FONT_FAMILIES}
          service={service}
        />
        <StyleInput label="Font Size" prop="font-size" defaultValue="14px" service={service} />
        <StyleInput
          label="Font Weight"
          prop="font-weight"
          defaultValue="700"
          type="select"
          options={['400', '500', '600', '700', '800', '900']}
          service={service}
        />
        <StyleInput
          label="Text Transform"
          prop="text-transform"
          defaultValue="none"
          type="select"
          options={['none', 'uppercase', 'capitalize', 'lowercase']}
          service={service}
        />
        <StyleInput
          label="Letter Spacing"
          prop="letter-spacing"
          defaultValue="0.02em"
          type="select"
          options={['0em', '0.02em', '0.05em', '0.1em', '0.15em']}
          service={service}
        />
      </TraitGroup>

      <TraitGroup title="Appearance">
        <StyleInput label="Background" prop="background-color" defaultValue="#0D5771" type="color" service={service} />
        <StyleInput label="Text Color" prop="color" defaultValue="#FFFFFF" type="color" service={service} />
        <StyleInput label="Border Radius" prop="border-radius" defaultValue="12px" service={service} />
        <StyleInput label="Padding" prop="padding" defaultValue="12px 24px" service={service} />
      </TraitGroup>
    </div>
  );
}

// ── Booking/WhatsApp panel ─────────────────────────────────────────────────

function BookingPanel() {
  const { service } = useEditor();
  const traits = service?.getSelectedComponentTraits() ?? {};

  return (
    <div className="space-y-4">
      <SectionHeader icon={<Phone className="w-4 h-4" />} title="WhatsApp Booking" badge="Booking" badgeColor="text-emerald-700" />

      <TraitGroup title="Integration">
        <TraitInput label="WhatsApp Number" value={traits['data-phone'] ?? ''} placeholder="+1234567890" onChange={(v) => service?.updateSelectedTrait('data-phone', v)} />
        <TraitInput label="Pre-filled Message" value={traits['data-message'] ?? ''} placeholder="Hi! I'd like to book..." onChange={(v) => service?.updateSelectedTrait('data-message', v)} multiline />
      </TraitGroup>

      <div className="px-1">
        <a
          href="https://wa.me"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-[11px] text-emerald-700 hover:text-emerald-800 font-bold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Test WhatsApp link
        </a>
      </div>
    </div>
  );
}

// ── Services panel ─────────────────────────────────────────────────────────

function ServicesPanel() {
  const { service } = useEditor();
  const traits = service?.getSelectedComponentTraits() ?? {};

  return (
    <div className="space-y-4">
      <SectionHeader icon={<Star className="w-4 h-4" />} title="Services Section" badge="Services" />
      <TraitGroup title="Content">
        <TraitInput label="Section Title" value={traits['data-section-title'] ?? 'Curated Beauty Experiences'} onChange={(v) => service?.updateSelectedTrait('data-section-title', v)} />
      </TraitGroup>
      <div className="px-1">
        <p className="text-[10px] text-[#64748B] leading-relaxed">
          Click individual service cards on canvas to edit their title, price, and description directly.
        </p>
      </div>
    </div>
  );
}

// ── Generic fallback (raw element selected) ────────────────────────────────

function GenericPanel({ type }: { type: string }) {
  const { service } = useEditor();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="px-2 py-0.5 rounded-md bg-[#F7FAFC] text-[#0D5771] text-[10px] font-mono border border-[#E2E8F0] font-bold">{type}</span>
        <span className="text-[11px] text-[#64748B]">Selected</span>
      </div>

      <TraitGroup title="Style">
        <StyleInput label="Background" prop="background-color" defaultValue="transparent" type="color" service={service} />
        <StyleInput label="Text Color" prop="color" defaultValue="#1A202C" type="color" service={service} />
        <StyleInput label="Font Size" prop="font-size" defaultValue="16px" service={service} />
        <StyleInput label="Padding" prop="padding" defaultValue="0px" service={service} />
        <StyleInput label="Margin" prop="margin" defaultValue="0px" service={service} />
        <StyleInput label="Border Radius" prop="border-radius" defaultValue="0px" service={service} />
      </TraitGroup>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────

function SectionHeader({
  icon, title, badge, badgeColor = 'text-[#0D5771]',
}: {
  icon: React.ReactNode; title: string; badge: string; badgeColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-[#0D5771]">{icon}</span>
      <h3 className="text-[12px] font-extrabold text-[#1A202C]">{title}</h3>
      <span className={`ml-auto text-[8px] font-bold uppercase tracking-wider ${badgeColor} bg-[#F7FAFC] px-2 py-0.5 rounded-full border border-[#E2E8F0]`}>
        {badge}
      </span>
    </div>
  );
}

function TraitGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#0D5771] font-mono px-1">{title}</p>
      <div className="space-y-2 bg-[#F7FAFC] rounded-xl p-3 border border-[#E2E8F0]">
        {children}
      </div>
    </div>
  );
}

function TraitInput({
  label, value, onChange, placeholder, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  const inputId = `trait-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="text-[10px] text-[#64748B] font-bold block">{label}</label>
      {multiline ? (
        <textarea
          id={inputId}
          name={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-2.5 py-2 text-[11px] text-[#1A202C] placeholder-[#94A3B8] focus:outline-none focus:border-[#0D5771] focus:ring-1 focus:ring-[#0D5771] resize-none"
          suppressHydrationWarning
        />
      ) : (
        <input
          id={inputId}
          name={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-2.5 py-2 text-[11px] text-[#1A202C] placeholder-[#94A3B8] focus:outline-none focus:border-[#0D5771] focus:ring-1 focus:ring-[#0D5771]"
          suppressHydrationWarning
        />
      )}
    </div>
  );
}

function StyleInput({
  label, prop, defaultValue, type = 'text', options, service,
}: {
  label: string; prop: string; defaultValue: string; type?: 'text' | 'color' | 'select';
  options?: (string | { label: string; value: string })[]; service: ReturnType<typeof useEditor>['service'];
}) {
  const [val, setVal] = React.useState(defaultValue);
  const inputId = `style-${prop.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const handleChange = (v: string) => {
    setVal(v);
    service?.updateSelectedStyle(prop, v);
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={inputId} className="text-[10px] text-[#64748B] font-bold whitespace-nowrap">{label}</label>
      {type === 'color' ? (
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            name={inputId}
            type="color"
            value={val}
            onChange={(e) => handleChange(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            suppressHydrationWarning
          />
          <span className="text-[10px] text-[#64748B] font-mono">{val}</span>
        </div>
      ) : type === 'select' ? (
        <select
          id={inputId}
          name={inputId}
          value={val}
          onChange={(e) => handleChange(e.target.value)}
          className="max-w-[140px] truncate bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-2 py-1 text-[11px] text-[#1A202C] focus:outline-none focus:border-[#0D5771]"
          suppressHydrationWarning
        >
          {options?.map((o) => {
            const optVal = typeof o === 'string' ? o : o.value;
            const optLabel = typeof o === 'string' ? o : o.label;
            return <option key={optVal} value={optVal}>{optLabel}</option>;
          })}
        </select>
      ) : (
        <input
          id={inputId}
          name={inputId}
          type="text"
          value={val}
          onChange={(e) => handleChange(e.target.value)}
          className="w-24 bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-2 py-1 text-[11px] text-[#1A202C] font-mono focus:outline-none focus:border-[#0D5771]"
          suppressHydrationWarning
        />
      )}
    </div>
  );
}

function AlignmentButtons({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  const options = ['left', 'center', 'right', 'justify'];
  return (
    <div className="flex gap-1">
      {options.map((align) => (
        <button
          key={align}
          onClick={() => service?.updateSelectedStyle('text-align', align)}
          className="flex-1 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] text-[10px] text-[#64748B] hover:text-[#1A202C] hover:border-[#0D5771] transition-all capitalize"
        >
          {align.charAt(0).toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ── Main RightPanel ─────────────────────────────────────────────────────────

export function RightPanel() {
  const { selectedComponent, service, attachSelectedToChat } = useEditor();
  const type = selectedComponent.type?.toLowerCase() ?? null;

  const renderPanel = () => {
    if (!type) return <NoSelectionPanel />;
    if (type.includes('hero') || type.includes('cuzmify-hero')) return <HeroPanel />;
    if (type.includes('services') || type.includes('service')) return <ServicesPanel />;
    if (type.includes('booking') || type.includes('whatsapp')) return <BookingPanel />;
    if (type === 'text' || type === 'span' || type === 'p' || type === 'h1' || type === 'h2' || type === 'h3') return <TextPanel />;
    if (type === 'image' || type === 'img') return <ImagePanel />;
    if (type === 'button' || type === 'a' || type.includes('button')) return <ButtonPanel />;
    return <GenericPanel type={type} />;
  };

  return (
    <aside
      style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}
      className="shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-x-hidden animate-in slide-in-from-right duration-200 shadow-2xs z-30"
    >
      {/* Precision Panel Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-50/50 shrink-0 flex items-center justify-between">
        <h2 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono">
          {!type ? 'DESIGN & THEMES' : type.replace('cuzmify-', '').replace(/-/g, ' ')}
        </h2>
        <div className="flex items-center gap-1.5">
          {type && (
            <span className="text-[9px] font-bold text-[#0D5771] uppercase bg-[#0D5771]/10 px-2 py-0.5 rounded font-mono border border-[#0D5771]/20">
              INSPECTING
            </span>
          )}
          <button
            onClick={() => service?.deselect()}
            className="w-6 h-6 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Close Panel (Deselect)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
        {type && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#0D5771]/10 via-[#0D5771]/5 to-transparent border border-[#0D5771]/20 shadow-2xs space-y-2 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-[#0D5771] flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> TARGET WITH AI
              </span>
              <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                &lt;{type}&gt;
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] leading-snug">
              Pinpoint this element in the AI Copilot to modify styling, width, or text with zero impact on other sections.
            </p>
            <button
              onClick={attachSelectedToChat}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white text-[11px] font-bold shadow-md shadow-[#0D5771]/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
              <span>Add Element to AI Chat</span>
            </button>
          </div>
        )}

        {renderPanel()}
      </div>
    </aside>
  );
}
