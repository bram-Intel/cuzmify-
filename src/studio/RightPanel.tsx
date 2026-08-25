'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MousePointer2,
  Type,
  Image as ImageIcon,
  Square,
  Layout,
  Phone,
  Palette,
  X,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Maximize2,
  Sliders,
  Move,
  Box,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Wand2,
  Link as LinkIcon,
  Columns,
  Rows,
  ExternalLink,
  MessageCircle,
  ShoppingBag,
  CreditCard,
  Calendar,
  Settings,
  Upload,
  Check,
} from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import { DESIGN_TOKENS } from './theme/DesignTokens';
import { AIEngine } from './ai/AIEngine';
import type { ThemeName } from '@/core/project-schema';

// ── Color Sanitizer ─────────────────────────────────────────────────────────
function ensureHexColor(color?: string, fallback: string = '#FFFFFF'): string {
  if (!color || color === 'transparent' || color === 'inherit' || color === 'initial' || color === 'none') {
    return fallback;
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
    if (color.length === 4) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    return color;
  }
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return fallback;
}

// ── Clean CSS Unit Parser ───────────────────────────────────────────────────
function parseCleanUnit(value: string, defaultUnit = 'px', isDecimal = false): { num: number; unit: string; isSpecial: boolean } {
  if (!value || value === 'auto' || value === 'fit-content' || value === 'none') {
    return { num: 0, unit: value || 'auto', isSpecial: true };
  }
  const match = String(value).trim().match(/^([+-]?\d*\.?\d+)\s*(px|%|rem|em|vw|vh)?$/i);
  if (match) {
    const rawNum = parseFloat(match[1]) || 0;
    return {
      num: isDecimal ? Math.round(rawNum * 100) / 100 : Math.round(rawNum),
      unit: match[2] || defaultUnit,
      isSpecial: false,
    };
  }
  return { num: 0, unit: defaultUnit, isSpecial: false };
}

// ── Streamlined Clean Slider + Manual Input Component ───────────────────────
function CleanSlider({
  label,
  prop,
  min = 0,
  max = 100,
  step = 1,
  defaultUnit = 'px',
  defaultValue = '',
  presets,
  service,
}: {
  label: string;
  prop: string;
  min?: number;
  max?: number;
  step?: number;
  defaultUnit?: string;
  defaultValue?: string;
  presets?: { label: string; value: string }[];
  service: ReturnType<typeof useEditor>['service'];
}) {
  const isDecimal = step < 1;
  const currentVal = service?.getSelectedStyle(prop) || defaultValue || '';
  const parsed = parseCleanUnit(currentVal, defaultUnit, isDecimal);

  const [numValue, setNumValue] = useState<number>(parsed.num);
  const [activeUnit, setActiveUnit] = useState<string>(parsed.unit || defaultUnit);
  const [isSpecial, setIsSpecial] = useState<boolean>(parsed.isSpecial);

  useEffect(() => {
    const val = service?.getSelectedStyle(prop) || defaultValue || '';
    const p = parseCleanUnit(val, defaultUnit, isDecimal);
    setNumValue(p.num);
    setActiveUnit(p.unit || defaultUnit);
    setIsSpecial(p.isSpecial);
  }, [currentVal, prop, defaultValue, defaultUnit, isDecimal, service]);

  // Subscribe to editor change events (e.g. keyboard arrow nudging) so slider updates in real time
  useEffect(() => {
    if (!service) return;
    const unsub = service.onChanged(() => {
      const val = service.getSelectedStyle(prop) || defaultValue || '';
      const p = parseCleanUnit(val, defaultUnit, isDecimal);
      setNumValue(p.num);
      setActiveUnit(p.unit || defaultUnit);
      setIsSpecial(p.isSpecial);
    });
    return () => unsub();
  }, [service, prop, defaultValue, defaultUnit, isDecimal]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawN = parseFloat(e.target.value);
    const n = isDecimal ? Math.round(rawN * 100) / 100 : Math.round(rawN);
    setNumValue(n);
    setIsSpecial(false);
    const unit = activeUnit === 'auto' ? defaultUnit : activeUnit;
    service?.updateSelectedStyle(prop, `${n}${unit}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim().toLowerCase();
    if (raw === 'auto' || raw === 'fit-content' || raw === 'none') {
      setIsSpecial(true);
      service?.updateSelectedStyle(prop, raw);
      return;
    }
    const rawN = parseFloat(raw);
    if (!isNaN(rawN)) {
      const n = isDecimal ? Math.round(rawN * 100) / 100 : Math.round(rawN);
      setNumValue(n);
      setIsSpecial(false);
      const unit = activeUnit === 'auto' ? defaultUnit : activeUnit;
      service?.updateSelectedStyle(prop, `${n}${unit}`);
    }
  };

  const handlePreset = (val: string) => {
    const p = parseCleanUnit(val, defaultUnit, isDecimal);
    setNumValue(p.num);
    setActiveUnit(p.unit);
    setIsSpecial(p.isSpecial);
    service?.updateSelectedStyle(prop, val);
  };

  const effectiveMin = Math.min(min, numValue);
  const effectiveMax = Math.max(max, numValue);

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700">{label}</span>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
          <input
            type="text"
            value={isSpecial ? parsed.unit : numValue}
            onChange={handleInputChange}
            className="w-12 text-[11px] font-mono font-bold text-slate-800 text-right bg-transparent focus:outline-none"
          />
          {!isSpecial && <span className="text-[10px] font-mono text-slate-400">{defaultUnit}</span>}
        </div>
      </div>

      <input
        type="range"
        min={effectiveMin}
        max={effectiveMax}
        step={step}
        value={isSpecial ? effectiveMin : numValue}
        onChange={handleSliderChange}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0D5771] hover:bg-slate-300 transition-all"
      />

      {presets && presets.length > 0 && (
        <div className="flex items-center gap-1 pt-0.5">
          {presets.map((p) => {
            const isSelected = isSpecial ? parsed.unit === p.value : `${numValue}${activeUnit}` === p.value;
            return (
              <button
                key={p.label}
                onClick={() => handlePreset(p.value)}
                className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0D5771] text-white border-[#0D5771]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Clean Color Input with Palette ──────────────────────────────────────────
function CleanColorPicker({
  label,
  prop,
  defaultValue = '#FFFFFF',
  service,
}: {
  label: string;
  prop: string;
  defaultValue?: string;
  service: ReturnType<typeof useEditor>['service'];
}) {
  const currentVal = service?.getSelectedStyle(prop) || defaultValue;
  const safeHex = ensureHexColor(currentVal, defaultValue);

  const handleChange = (hex: string) => {
    service?.updateSelectedStyle(prop, hex);
  };

  const palette = ['#0D5771', '#070C14', '#25D366', '#FFFFFF', '#F8FAFC', '#F59E0B', '#10B981', '#3B82F6'];

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700">{label}</span>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 shadow-2xs">
          <input
            type="color"
            value={safeHex}
            onChange={(e) => handleChange(e.target.value)}
            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
          />
          <input
            type="text"
            value={currentVal}
            onChange={(e) => handleChange(e.target.value)}
            className="w-16 text-[10px] font-mono font-bold text-slate-800 focus:outline-none uppercase"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 pt-0.5">
        {palette.map((c) => (
          <button
            key={c}
            onClick={() => handleChange(c)}
            style={{ backgroundColor: c }}
            className={`w-4 h-4 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition-transform cursor-pointer ${
              safeHex.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-[#0D5771] ring-offset-1' : ''
            }`}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}

// ── Card Section Container ──────────────────────────────────────────────────
function InspectorCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-2xs space-y-2.5 mb-2.5">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-800 font-mono border-b border-slate-100 pb-2">
        <span className="text-[#0D5771]">{icon}</span>
        <span>{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ── AI Rewrite Inline Block ────────────────────────────────────────────────
function AIRewriteHelper({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  const [loading, setLoading] = useState(false);

  const handleRewrite = async (style: 'polish' | 'punchy' | 'tone_luxury') => {
    if (!service || loading) return;
    const text = service.getSelectedText();
    if (!text || text.trim().length === 0) return;

    setLoading(true);
    try {
      const res = await AIEngine.rewriteInlineTextAsync(text.trim(), style);
      if (res?.transformed && res.transformed.trim().length > 0) {
        service.updateSelectedText(res.transformed.trim());
      }
    } catch (e) {
      console.warn('[AI Rewrite] error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2.5 rounded-xl bg-[#0D5771]/5 border border-[#0D5771]/15 space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[#0D5771]">
        <span className="flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-[#0D5771]" />
          <span>AI COPYWRITER</span>
        </span>
        {loading && <span className="animate-pulse text-[9px]">Generating…</span>}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[
          { id: 'polish' as const, label: '✨ Polish' },
          { id: 'punchy' as const, label: '⚡ Punchy' },
          { id: 'tone_luxury' as const, label: '💎 Luxury' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => handleRewrite(btn.id)}
            disabled={loading}
            className="py-1 text-[10px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Smart Action & Link Engine Inspector Card ──────────────────────────────
export function SmartActionLinkerCard({
  service,
  title = 'Smart Action & Link Engine',
}: {
  service: ReturnType<typeof useEditor>['service'];
  title?: string;
}) {
  const { setActiveModuleModal } = useEditor();
  const currentText = service?.getSelectedText() || '';
  const traits = service?.getSelectedComponentTraits() || {};
  const currentHref = traits.href || '';
  const currentAction = traits['data-cuzmify-action'] || (currentHref.includes('wa.me') ? 'whatsapp:booking' : (currentHref ? 'custom:url' : 'whatsapp:booking'));
  const currentTargetId = traits['data-cuzmify-target-id'] || '';

  const services = service?.getServices() || [];
  const products = service?.getProducts() || [];

  const handleActionChange = (action: string) => {
    if (!service) return;
    service.updateSelectedTrait('data-cuzmify-action', action);

    if (action === 'whatsapp:booking') {
      const firstSrv = services[0];
      const targetId = currentTargetId || firstSrv?.id;
      if (targetId) {
        service.updateSelectedTrait('data-cuzmify-target-id', targetId);
      }
      const url = service.generateWhatsAppLink({ type: 'booking', targetId });
      service.updateSelectedTrait('href', url);
    } else if (action === 'whatsapp:order') {
      const firstPrd = products[0];
      const targetId = currentTargetId || firstPrd?.id;
      if (targetId) {
        service.updateSelectedTrait('data-cuzmify-target-id', targetId);
      }
      const url = service.generateWhatsAppLink({ type: 'order', targetId });
      service.updateSelectedTrait('href', url);
    } else if (action === 'whatsapp:general') {
      const url = service.generateWhatsAppLink({ type: 'general' });
      service.updateSelectedTrait('href', url);
    } else if (action === 'cart:add') {
      service.updateSelectedTrait('href', '#cart');
    } else if (action === 'cart:open' || action === 'cart:toggle') {
      service.updateSelectedTrait('href', '#cart');
    } else if (action === 'checkout' || action === 'payment:checkout') {
      service.updateSelectedTrait('href', '#checkout');
    } else if (action === 'booking:calendar') {
      service.updateSelectedTrait('href', '#booking');
    }
  };

  const handleServiceSelect = (srvId: string) => {
    if (!service) return;
    service.updateSelectedTrait('data-cuzmify-action', 'whatsapp:booking');
    service.updateSelectedTrait('data-cuzmify-target-id', srvId);
    const url = service.generateWhatsAppLink({ type: 'booking', targetId: srvId });
    service.updateSelectedTrait('href', url);
  };

  const handleProductSelect = (prdId: string) => {
    if (!service) return;
    service.updateSelectedTrait('data-cuzmify-action', 'whatsapp:order');
    service.updateSelectedTrait('data-cuzmify-target-id', prdId);
    const url = service.generateWhatsAppLink({ type: 'order', targetId: prdId });
    service.updateSelectedTrait('href', url);
  };

  return (
    <InspectorCard title={title} icon={<LinkIcon className="w-3.5 h-3.5" />}>
      {/* Action Label */}
      {currentText && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Element Label</label>
          <input
            type="text"
            value={currentText}
            onChange={(e) => service?.updateSelectedText(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-[#0D5771]"
            placeholder="Action Label"
          />
        </div>
      )}

      {/* Action Type Dropdown */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-600">Attached Action Engine</label>
          <button
            onClick={() => setActiveModuleModal('whatsapp')}
            className="text-[9px] font-bold text-[#0D5771] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <Settings className="w-2.5 h-2.5" />
            <span>Configure</span>
          </button>
        </div>
        <select
          value={currentAction}
          onChange={(e) => handleActionChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-[#0D5771]"
        >
          <option value="whatsapp:booking">💬 WhatsApp Booking (Service)</option>
          <option value="whatsapp:order">💬 WhatsApp Quick Order (Product)</option>
          <option value="whatsapp:general">💬 WhatsApp General Chat</option>
          <option value="cart:add">🛒 Add to Cart &amp; Open Drawer</option>
          <option value="cart:open">🛍️ Open Shopping Cart</option>
          <option value="checkout">💳 Online Checkout (Paystack/Stripe)</option>
          <option value="booking:calendar">📅 Booking Form Modal</option>
          <option value="custom:url">🔗 Custom URL / Section Anchor</option>
        </select>
      </div>

      {/* Dynamic Target Selector depending on Action */}
      {currentAction === 'whatsapp:booking' && (
        <div className="space-y-1.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
          <label className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
            Target Service Item
          </label>
          <select
            value={currentTargetId}
            onChange={(e) => handleServiceSelect(e.target.value)}
            className="w-full bg-white border border-emerald-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 focus:outline-none"
          >
            <option value="">General Booking Consultation</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({service?.formatCurrency(s.price) || `$${s.price}`})
              </option>
            ))}
          </select>
          <a
            href={currentHref || service?.generateWhatsAppLink({ type: 'booking', targetId: currentTargetId })}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between text-[10px] text-emerald-700 hover:text-emerald-900 font-bold pt-1"
          >
            <span>Test WhatsApp Link</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {currentAction === 'whatsapp:order' && (
        <div className="space-y-1.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
          <label className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
            Target Product Item
          </label>
          <select
            value={currentTargetId}
            onChange={(e) => handleProductSelect(e.target.value)}
            className="w-full bg-white border border-emerald-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-800 focus:outline-none"
          >
            <option value="">Select a Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({service?.formatCurrency(p.price) || `$${p.price}`})
              </option>
            ))}
          </select>
          <a
            href={currentHref || service?.generateWhatsAppLink({ type: 'order', targetId: currentTargetId })}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between text-[10px] text-emerald-700 hover:text-emerald-900 font-bold pt-1"
          >
            <span>Test WhatsApp Order</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {currentAction === 'custom:url' && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-600">Destination Link</label>
          <input
            type="text"
            value={currentHref}
            onChange={(e) => service?.updateSelectedTrait('href', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-700 focus:outline-none focus:border-[#0D5771]"
            placeholder="https://... or #services"
          />
        </div>
      )}
    </InspectorCard>
  );
}

// ── Button Specific Controls ────────────────────────────────────────────────
function ButtonInspector({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  return (
    <>
      <SmartActionLinkerCard service={service} title="Smart Action & Link Engine" />

      <InspectorCard title="Button Sizing & Shape" icon={<Maximize2 className="w-3.5 h-3.5" />}>
        {/* Shape Presets */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-600">Button Shape</label>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Square', radius: '0px' },
              { label: 'Rounded', radius: '12px' },
              { label: 'Pill 💊', radius: '9999px' },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => service?.updateSelectedStyle('border-radius', s.radius)}
                className="py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs text-center"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <CleanSlider
          label="Button Width"
          prop="width"
          min={80}
          max={600}
          step={4}
          defaultValue="auto"
          presets={[
            { label: 'Auto (Fit)', value: 'auto' },
            { label: '100% Full', value: '100%' },
            { label: '240px', value: '240px' },
          ]}
          service={service}
        />

        <CleanSlider
          label="Button Padding"
          prop="padding"
          min={4}
          max={32}
          step={2}
          defaultValue="12px 24px"
          presets={[
            { label: 'Compact', value: '8px 16px' },
            { label: 'Standard', value: '12px 24px' },
            { label: 'Spacious', value: '16px 32px' },
          ]}
          service={service}
        />
      </InspectorCard>

      <InspectorCard title="Button Colors" icon={<Palette className="w-3.5 h-3.5" />}>
        <CleanColorPicker label="Background" prop="background-color" defaultValue="#0D5771" service={service} />
        <CleanColorPicker label="Text Color" prop="color" defaultValue="#FFFFFF" service={service} />
      </InspectorCard>
    </>
  );
}

// ── Typography Controls (Headings, Paragraphs, Text) ────────────────────────
function TypographyInspector({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  const currentAlign = service?.getSelectedStyle('text-align') || 'left';
  const currentFont = service?.getSelectedStyle('font-family') || "'Plus Jakarta Sans', sans-serif";

  const fonts = [
    { label: 'Plus Jakarta Sans (Modern Clean)', val: "'Plus Jakarta Sans', sans-serif" },
    { label: 'Playfair Display (Luxury Serif)', val: "'Playfair Display', serif" },
    { label: 'Cormorant Garamond (Editorial)', val: "'Cormorant Garamond', serif" },
    { label: 'Bodoni Moda (High Fashion)', val: "'Bodoni Moda', serif" },
    { label: 'Inter (Tech Minimal)', val: "'Inter', sans-serif" },
    { label: 'Outfit (Geometric)', val: "'Outfit', sans-serif" },
    { label: 'Syne (Avant-Garde)', val: "'Syne', sans-serif" },
    { label: 'Space Grotesk (Neo-Brutalism)', val: "'Space Grotesk', sans-serif" },
    { label: 'Cinzel (Royal Roman)', val: "'Cinzel', serif" },
  ];

  return (
    <>
      <AIRewriteHelper service={service} />

      <SmartActionLinkerCard service={service} title="Attach Action / Link to Text" />

      <InspectorCard title="Typography & Font" icon={<Type className="w-3.5 h-3.5" />}>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-600">Font Family</label>
          <select
            value={currentFont}
            onChange={(e) => service?.updateSelectedStyle('font-family', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-[#0D5771]"
          >
            {fonts.map((f) => (
              <option key={f.label} value={f.val}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <CleanSlider
          label="Font Size"
          prop="font-size"
          min={10}
          max={84}
          step={1}
          defaultValue="16px"
          presets={[
            { label: '14px', value: '14px' },
            { label: '18px', value: '18px' },
            { label: '24px', value: '24px' },
            { label: '36px', value: '36px' },
            { label: '48px', value: '48px' },
          ]}
          service={service}
        />

        {/* Font Weight */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold text-slate-600">Font Weight</label>
          <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { label: 'Regular', val: '400' },
              { label: 'Medium', val: '500' },
              { label: 'Semi', val: '600' },
              { label: 'Bold', val: '700' },
            ].map((w) => (
              <button
                key={w.label}
                onClick={() => service?.updateSelectedStyle('font-weight', w.val)}
                className="py-1 text-[10px] font-bold rounded-md text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all cursor-pointer text-center"
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment Segmented Buttons */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold text-slate-600">Alignment</label>
          <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'left', icon: <AlignLeft className="w-3.5 h-3.5 mx-auto" /> },
              { id: 'center', icon: <AlignCenter className="w-3.5 h-3.5 mx-auto" /> },
              { id: 'right', icon: <AlignRight className="w-3.5 h-3.5 mx-auto" /> },
              { id: 'justify', icon: <AlignJustify className="w-3.5 h-3.5 mx-auto" /> },
            ].map((a) => (
              <button
                key={a.id}
                onClick={() => service?.updateSelectedStyle('text-align', a.id)}
                className={`py-1 rounded-md transition-all cursor-pointer ${
                  currentAlign.toLowerCase() === a.id ? 'bg-[#0D5771] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {a.icon}
              </button>
            ))}
          </div>
        </div>

        <CleanColorPicker label="Text Color" prop="color" defaultValue="#1A202C" service={service} />
      </InspectorCard>

      {/* Text Position, Spacing & Nudging */}
      <InspectorCard title="Text Position & Spacing" icon={<Move className="w-3.5 h-3.5" />}>
        <CleanSlider
          label="Vertical Position (Top Shift)"
          prop="margin-top"
          min={-150}
          max={300}
          step={4}
          defaultValue="0px"
          presets={[
            { label: '-40px', value: '-40px' },
            { label: '0px', value: '0px' },
            { label: '24px', value: '24px' },
            { label: '64px', value: '64px' },
            { label: '120px', value: '120px' },
          ]}
          service={service}
        />

        <CleanSlider
          label="Bottom Spacing (Gap Below)"
          prop="margin-bottom"
          min={0}
          max={200}
          step={4}
          defaultValue="0px"
          presets={[
            { label: '0px', value: '0px' },
            { label: '16px', value: '16px' },
            { label: '32px', value: '32px' },
            { label: '64px', value: '64px' },
          ]}
          service={service}
        />

        <CleanSlider
          label="Horizontal Position / Indent"
          prop="margin-left"
          min={-200}
          max={800}
          step={4}
          defaultValue="0px"
          presets={[
            { label: '0px', value: '0px' },
            { label: 'Center (0 auto)', value: '0px auto' },
            { label: '120px', value: '120px' },
            { label: '300px', value: '300px' },
            { label: '500px', value: '500px' },
          ]}
          service={service}
        />
      </InspectorCard>

      {/* Text Box Width & Line Wrapping */}
      <InspectorCard title="Text Box Width & Wrap" icon={<Maximize2 className="w-3.5 h-3.5" />}>
        <CleanSlider
          label="Max Width"
          prop="max-width"
          min={160}
          max={1200}
          step={10}
          defaultValue="none"
          presets={[
            { label: '100% Full', value: '100%' },
            { label: '540px (Paragraph)', value: '540px' },
            { label: '380px (Compact)', value: '380px' },
            { label: 'Auto / None', value: 'none' },
          ]}
          service={service}
        />

        <CleanSlider
          label="Line Height"
          prop="line-height"
          min={0.8}
          max={2.5}
          step={0.05}
          defaultUnit=""
          defaultValue="1.5"
          presets={[
            { label: 'Tight (1.1)', value: '1.1' },
            { label: 'Normal (1.5)', value: '1.5' },
            { label: 'Relaxed (1.8)', value: '1.8' },
          ]}
          service={service}
        />

        <CleanSlider
          label="Letter Spacing (Tracking)"
          prop="letter-spacing"
          min={-0.05}
          max={0.3}
          step={0.01}
          defaultUnit="em"
          defaultValue="0em"
          presets={[
            { label: 'Normal (0)', value: '0em' },
            { label: 'Wide (0.08em)', value: '0.08em' },
            { label: 'Caps (0.12em)', value: '0.12em' },
          ]}
          service={service}
        />
      </InspectorCard>
    </>
  );
}

// ── Image Inspector ────────────────────────────────────────────────────────
function ImageInspector({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  const { setActiveModuleModal, setSaveToast } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const traits = service?.getSelectedComponentTraits() || {};
  const currentSrc = traits.src || '';
  const currentAlt = traits.alt || '';

  const mediaVault = service?.getMediaVault() || [];

  const handleSrcChange = (val: string) => {
    service?.updateSelectedTrait('src', val);
  };

  const handleUploadLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const name = file.name.replace(/\.[^/.]+$/, '');
      service?.applyImageToSelected(dataUrl, name);
      service?.addMediaAsset({
        url: dataUrl,
        name,
        type: 'gallery',
        source: 'upload',
      });
      setSaveToast(`✦ Replaced image on canvas with "${name}"!`);
      setTimeout(() => setSaveToast(null), 3000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <SmartActionLinkerCard service={service} title="Image Click Action" />

      <InspectorCard title="Image Source & Media Vault" icon={<ImageIcon className="w-3.5 h-3.5" />}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadLocalFile}
          className="hidden"
        />

        {/* Upload Action Button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload from Computer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModuleModal('media')}
            className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Browse Vault</span>
          </button>
        </div>

        {/* Quick Swap Media Vault Strips */}
        {mediaVault.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">
                Quick Swap from Vault
              </label>
              <button
                type="button"
                onClick={() => setActiveModuleModal('media')}
                className="text-[9px] font-bold text-[#0D5771] hover:underline"
              >
                View all ({mediaVault.length})
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {mediaVault.slice(0, 4).map((m) => {
                const isActive = currentSrc === m.url;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      service?.applyImageToSelected(m.url, m.name);
                      setSaveToast(`✦ Swapped image: ${m.name}`);
                      setTimeout(() => setSaveToast(null), 2000);
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      isActive ? 'border-[#0D5771] ring-2 ring-[#0D5771]/20 scale-105' : 'border-slate-200 hover:border-slate-400'
                    }`}
                    title={`Click to use ${m.name}`}
                  >
                    <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                    {isActive && (
                      <span className="absolute inset-0 bg-[#0D5771]/30 flex items-center justify-center text-white">
                        <Check className="w-3 h-3 font-bold" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-[10px] font-bold text-slate-600">Direct Image URL</label>
          <input
            type="text"
            value={currentSrc}
            onChange={(e) => handleSrcChange(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-800 focus:outline-none focus:border-[#0D5771]"
          />
        </div>

        <div className="space-y-1 pt-1">
          <label className="text-[10px] font-bold text-slate-600">Alt Text (SEO &amp; Accessibility)</label>
          <input
            type="text"
            value={currentAlt}
            onChange={(e) => service?.updateSelectedTrait('alt', e.target.value)}
            placeholder="e.g. Bridal Glam Artistry"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-[#0D5771]"
          />
        </div>
      </InspectorCard>

      <InspectorCard title="Dimensions & Style" icon={<Maximize2 className="w-3.5 h-3.5" />}>
        <CleanSlider
          label="Corner Radius"
          prop="border-radius"
          min={0}
          max={60}
          step={2}
          defaultValue="16px"
          presets={[
            { label: 'Square', value: '0px' },
            { label: 'Rounded', value: '16px' },
            { label: 'Circle ⭕', value: '9999px' },
          ]}
          service={service}
        />
        <CleanSlider
          label="Max Width"
          prop="max-width"
          min={100}
          max={1200}
          step={20}
          defaultValue="100%"
          service={service}
        />
      </InspectorCard>
    </>
  );
}

// ── Generic / Container Inspector ───────────────────────────────────────────
function ContainerInspector({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  const currentDisplay = service?.getSelectedStyle('display') || 'block';

  return (
    <>
      <SmartActionLinkerCard service={service} title="Attach Action / Clickable Card" />

      <InspectorCard title="Dimensions & Sizing" icon={<Maximize2 className="w-3.5 h-3.5" />}>
        <CleanSlider
          label="Width"
          prop="width"
          min={0}
          max={1200}
          step={10}
          defaultValue="100%"
          presets={[
            { label: '100% Full', value: '100%' },
            { label: 'Auto (Fit)', value: 'auto' },
            { label: '50%', value: '50%' },
          ]}
          service={service}
        />

        <CleanSlider
          label="Max Width"
          prop="max-width"
          min={300}
          max={1400}
          step={20}
          defaultValue="1200px"
          presets={[
            { label: '1200px (Standard)', value: '1200px' },
            { label: '100% Full', value: '100%' },
            { label: 'None', value: 'none' },
          ]}
          service={service}
        />
      </InspectorCard>

      <InspectorCard title="Spacing" icon={<Box className="w-3.5 h-3.5" />}>
        <CleanSlider
          label="Inner Spacing (Padding)"
          prop="padding"
          min={0}
          max={100}
          step={4}
          defaultValue="16px"
          presets={[
            { label: '0', value: '0px' },
            { label: '16px', value: '16px' },
            { label: '32px', value: '32px' },
            { label: '64px', value: '64px' },
          ]}
          service={service}
        />

        <CleanSlider
          label="Outer Spacing (Margin)"
          prop="margin"
          min={0}
          max={80}
          step={4}
          defaultValue="0px auto"
          presets={[
            { label: '0', value: '0px' },
            { label: 'Center (0 auto)', value: '0px auto' },
            { label: '24px', value: '24px' },
          ]}
          service={service}
        />
      </InspectorCard>

      <InspectorCard title="Layout Arrangement" icon={<Layout className="w-3.5 h-3.5" />}>
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'block', label: 'Stacked' },
            { id: 'flex', label: 'Side by Side' },
            { id: 'grid', label: 'Grid' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => service?.updateSelectedStyle('display', d.id)}
              className={`py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center ${
                currentDisplay.toLowerCase() === d.id ? 'bg-[#0D5771] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </InspectorCard>

      <InspectorCard title="Appearance & Colors" icon={<Palette className="w-3.5 h-3.5" />}>
        <CleanColorPicker label="Background Color" prop="background-color" defaultValue="#FFFFFF" service={service} />
        <CleanSlider
          label="Corner Radius"
          prop="border-radius"
          min={0}
          max={60}
          step={2}
          defaultValue="0px"
          presets={[
            { label: 'Square', value: '0px' },
            { label: 'Rounded', value: '16px' },
            { label: 'Pill 💊', value: '9999px' },
          ]}
          service={service}
        />
      </InspectorCard>
    </>
  );
}

// ── Collapsible Advanced Drawer (Position, Z-Index, Raw Coordinates) ────────
function AdvancedDrawer({ service }: { service: ReturnType<typeof useEditor>['service'] }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentPos = service?.getSelectedStyle('position') || 'static';

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer text-slate-600"
      >
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Move className="w-3 h-3 text-slate-500" />
          <span>Advanced Positioning &amp; Z-Index</span>
        </span>
        {isOpen ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-3 space-y-3 border-t border-slate-100 bg-white">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600">Position Mode</label>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-lg">
              {['static', 'relative', 'absolute', 'fixed'].map((p) => (
                <button
                  key={p}
                  onClick={() => service?.updateSelectedStyle('position', p)}
                  className={`py-1 text-[9px] font-bold rounded-md capitalize transition-all cursor-pointer text-center ${
                    currentPos.toLowerCase() === p ? 'bg-[#0D5771] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <CleanSlider label="Z-Index" prop="z-index" min={0} max={999} step={1} defaultUnit="" service={service} />
          <CleanSlider
            label="Opacity"
            prop="opacity"
            min={0}
            max={1}
            step={0.05}
            defaultUnit=""
            defaultValue="1"
            presets={[
              { label: '100%', value: '1' },
              { label: '75%', value: '0.75' },
              { label: '50%', value: '0.5' },
              { label: '25%', value: '0.25' },
            ]}
            service={service}
          />
        </div>
      )}
    </div>
  );
}

// ── No Selection Panel ──────────────────────────────────────────────────────
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
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
        <MousePointer2 className="w-5 h-5 text-[#0D5771] mx-auto animate-bounce" />
        <h3 className="text-xs font-bold text-slate-800">Select Any Element</h3>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Click any button, text, heading, or container on the canvas to customize its styling with visual sliders.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-800 font-mono border-b border-slate-100 pb-2">
          <Palette className="w-3.5 h-3.5 text-[#0D5771]" />
          <span>Curated Theme Presets</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => {
            const tok = DESIGN_TOKENS[t.id];
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0D5771] bg-[#0D5771]/10 text-[#0D5771] font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:border-[#0D5771]/40 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-300" style={{ background: tok.colorSecondary }} />
                <span className="text-[10px] font-bold truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Streamlined RightPanel ─────────────────────────────────────────────
export function RightPanel() {
  const { selectedComponent, service, attachSelectedToChat } = useEditor();
  const type = selectedComponent.type?.toLowerCase() ?? null;

  const isButton =
    type === 'button' ||
    type === 'a' ||
    type === 'link' ||
    (type && type.includes('button')) ||
    (type && type.includes('link')) ||
    (selectedComponent.traits && ('href' in selectedComponent.traits || 'data-cuzmify-action' in selectedComponent.traits));
  const isText = type === 'text' || type === 'span' || type === 'p' || type === 'h1' || type === 'h2' || type === 'h3';
  const isImage = type === 'image' || type === 'img' || (selectedComponent.traits && 'src' in selectedComponent.traits);

  return (
    <aside
      style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}
      className="shrink-0 bg-slate-50/70 border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 shadow-2xs z-30 select-none"
    >
      {/* Precision Panel Header */}
      <div className="px-4 py-2.5 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <Sliders className="w-3.5 h-3.5 text-[#0D5771]" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono truncate">
            {!type ? 'DESIGN INSPECTOR' : `<${type.replace('cuzmify-', '')}>`}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {type && (
            <span className="text-[9px] font-bold text-[#0D5771] uppercase bg-[#0D5771]/10 px-2 py-0.5 rounded font-mono border border-[#0D5771]/20">
              ACTIVE
            </span>
          )}
          <button
            onClick={() => service?.deselect()}
            className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title="Deselect Element (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {!type ? (
          <NoSelectionPanel />
        ) : (
          <>
            {/* Quick AI Pinpoint Bar */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#0D5771]/10 via-[#0D5771]/5 to-transparent border border-[#0D5771]/20 shadow-2xs space-y-2 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#0D5771] flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> AI PINPOINT COPILOT
                </span>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                  &lt;{type}&gt;
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Target this element with AI prompts to modify copy or styling with zero impact on other sections.
              </p>
              <button
                onClick={attachSelectedToChat}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white text-[11px] font-bold shadow-md shadow-[#0D5771]/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                <span>Target Element with AI</span>
              </button>
            </div>

            {/* Context-Aware Inspector Sections */}
            {isButton ? (
              <ButtonInspector service={service} />
            ) : isText ? (
              <TypographyInspector service={service} />
            ) : isImage ? (
              <ImageInspector service={service} />
            ) : (
              <ContainerInspector service={service} />
            )}

            {/* Collapsed Advanced Positioning & Z-Index */}
            <AdvancedDrawer service={service} />
          </>
        )}
      </div>
    </aside>
  );
}
