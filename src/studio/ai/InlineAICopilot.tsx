'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Wand2, Zap, Crown, MessageSquare, ChevronDown, Check, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useEditor } from '../engine/EditorContext';
import { AIEngine, type InlineRewriteResult } from './AIEngine';

export function InlineAICopilot() {
  const { service, selectedComponent, isPreviewMode } = useEditor();
  const [selectedText, setSelectedText] = useState('');
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [variationsResult, setVariationsResult] = useState<InlineRewriteResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  const type = selectedComponent?.type?.toLowerCase() || '';
  const isTextual =
    type === 'text' ||
    type === 'span' ||
    type === 'p' ||
    type === 'h1' ||
    type === 'h2' ||
    type === 'h3' ||
    type === 'h4' ||
    type === 'button' ||
    type === 'a' ||
    type.includes('text') ||
    type.includes('button');

  // Sync position and selected text with canvas element
  useEffect(() => {
    if (!service || !selectedComponent.type || !isTextual || isPreviewMode) {
      setSelectedText('');
      setRect(null);
      setShowCustomInput(false);
      setVariationsResult(null);
      return;
    }

    const updatePosition = () => {
      const text = service.getSelectedText();
      const elementRect = service.getSelectedRect();
      setSelectedText(text);
      setRect(elementRect);
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 80);
    return () => clearTimeout(timer);
  }, [service, selectedComponent, isTextual, isPreviewMode]);

  if (isPreviewMode || !isTextual || !selectedText || !rect) {
    return null;
  }

  const handleAction = (
    action: 'polish' | 'punchy' | 'shorten' | 'whatsapp_hook' | 'tone_luxury' | 'tone_playful' | 'variations' | 'custom',
    customText?: string
  ) => {
    if (!service) return;

    if (action === 'variations') {
      const res = AIEngine.rewriteInlineText(selectedText, 'variations');
      setVariationsResult(res);
      return;
    }

    const res = AIEngine.rewriteInlineText(selectedText, action, customText);
    service.updateSelectedText(res.transformed);
    setSelectedText(res.transformed);
    setToastMessage(`✓ ${res.action}`);
    setShowCustomInput(false);
    setVariationsResult(null);

    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleApplyVariation = (variationText: string) => {
    if (!service) return;
    const clean = variationText.replace(/^[^\w]+Option\s*\d+\s*\([^)]+\):\s*/i, '').trim();
    service.updateSelectedText(clean);
    setSelectedText(clean);
    setVariationsResult(null);
    setToastMessage('✓ Applied Variation');
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Position precisely above selected element with viewport clamping
  const topPos = Math.max(68, rect.top - 42);
  const leftPos = Math.max(280, Math.min(window.innerWidth - 560, rect.left));

  return (
    <div
      style={{
        top: `${topPos}px`,
        left: `${leftPos}px`,
      }}
      className="fixed z-50 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto select-none font-sans"
    >
      {/* Precision Floating Toolbar */}
      <div className="h-9 px-1.5 flex items-center gap-1 rounded-xl bg-white border border-slate-200/90 shadow-[0_4px_24px_-2px_rgba(13,87,113,0.12),0_2px_6px_-1px_rgba(0,0,0,0.04)] text-slate-800 backdrop-blur-sm">
        
        {/* Sleek Leading AI Badge */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#0D5771]/10 text-[#0D5771] font-semibold text-[11px] tracking-tight shrink-0">
          <Sparkles className="w-3 h-3 text-[#0D5771]" />
          <span>AI</span>
        </div>

        <div className="h-3.5 w-px bg-slate-200 mx-0.5 shrink-0" />

        {/* Action: Polish */}
        <button
          onClick={() => handleAction('polish')}
          className="h-7 px-2 flex items-center gap-1.5 rounded-lg text-[12px] font-medium text-slate-700 hover:text-[#0D5771] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap group"
          title="Elevate vocabulary & flow"
        >
          <Wand2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          <span>Polish</span>
        </button>

        {/* Action: Punchy */}
        <button
          onClick={() => handleAction('punchy')}
          className="h-7 px-2 flex items-center gap-1.5 rounded-lg text-[12px] font-medium text-slate-700 hover:text-[#0D5771] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap group"
          title="Make concise and high-impact"
        >
          <Zap className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" />
          <span>Punchy</span>
        </button>

        {/* Action: Luxury */}
        <button
          onClick={() => handleAction('tone_luxury')}
          className="h-7 px-2 flex items-center gap-1.5 rounded-lg text-[12px] font-medium text-slate-700 hover:text-[#0D5771] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap group"
          title="Bespoke luxury tone"
        >
          <Crown className="w-3.5 h-3.5 text-slate-400 group-hover:text-yellow-600 transition-colors" />
          <span>Luxury</span>
        </button>

        {/* Action: WhatsApp */}
        <button
          onClick={() => handleAction('whatsapp_hook')}
          className="h-7 px-2 flex items-center gap-1.5 rounded-lg text-[12px] font-medium text-slate-700 hover:text-[#0D5771] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap group"
          title="Add WhatsApp conversion trigger"
        >
          <MessageSquare className="w-3.5 h-3.5 text-slate-400 group-hover:text-green-600 transition-colors" />
          <span>WhatsApp</span>
        </button>

        {/* Action: Variations */}
        <button
          onClick={() => handleAction('variations')}
          className="h-7 px-2 flex items-center gap-1 rounded-lg text-[12px] font-medium text-slate-700 hover:text-[#0D5771] hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          title="Generate 3 copy variations"
        >
          <span>Variations</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        <div className="h-3.5 w-px bg-slate-200 mx-0.5 shrink-0" />

        {/* Trailing Command Action: Ask AI */}
        <button
          onClick={() => {
            setShowCustomInput(!showCustomInput);
            if (!showCustomInput) {
              setTimeout(() => customInputRef.current?.focus(), 80);
            }
          }}
          className={`h-7 px-2.5 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
            showCustomInput
              ? 'bg-[#083D50] text-white shadow-xs'
              : 'bg-[#0D5771] hover:bg-[#083D50] text-white shadow-2xs'
          }`}
          title="Custom AI instruction"
        >
          <span>Ask AI</span>
          <span className="text-[9px] opacity-70 font-mono">↵</span>
        </button>
      </div>

      {/* Senior-Grade Inline Command Input Bar */}
      {showCustomInput && (
        <div className="h-9 px-2 flex items-center gap-1.5 rounded-xl bg-white border border-[#0D5771]/30 shadow-[0_8px_24px_-2px_rgba(13,87,113,0.16)] text-slate-900 animate-in slide-in-from-top-1 duration-150">
          <Sparkles className="w-3.5 h-3.5 text-[#0D5771] shrink-0" />
          <input
            ref={customInputRef}
            type="text"
            id="inline-ai-custom-prompt"
            name="inlineAiCustomPrompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customPrompt.trim()) {
                handleAction('custom', customPrompt);
                setCustomPrompt('');
              } else if (e.key === 'Escape') {
                setShowCustomInput(false);
              }
            }}
            placeholder="Instruct AI… e.g. 'translate to French', 'make friendly', 'shorter'"
            className="flex-1 bg-transparent text-[12px] text-slate-800 placeholder-slate-400 outline-none"
          />
          <button
            onClick={() => {
              if (customPrompt.trim()) {
                handleAction('custom', customPrompt);
                setCustomPrompt('');
              }
            }}
            disabled={!customPrompt.trim()}
            className="h-6 px-2 rounded-md bg-[#0D5771] hover:bg-[#083D50] disabled:opacity-30 text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Run</span>
            <CornerDownLeft className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={() => setShowCustomInput(false)}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Variations Popover */}
      {variationsResult?.variations && (
        <div className="p-2 flex flex-col gap-1 rounded-xl bg-white border border-slate-200 shadow-2xl text-slate-800 max-w-sm animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between px-1.5 py-1 border-b border-slate-100">
            <span className="text-[10px] font-mono font-bold text-[#0D5771] uppercase tracking-wider">
              Pick a Variation
            </span>
            <button
              onClick={() => setVariationsResult(null)}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {variationsResult.variations.map((v, i) => (
            <button
              key={i}
              onClick={() => handleApplyVariation(v)}
              className="text-left p-2 rounded-lg bg-slate-50 hover:bg-[#0D5771]/8 hover:border-[#0D5771]/30 border border-slate-100 text-[11px] text-slate-700 hover:text-slate-900 transition-all cursor-pointer flex items-start gap-1.5 leading-snug font-normal"
            >
              <span className="text-[10px] font-mono font-bold text-[#0D5771] shrink-0">#{i + 1}</span>
              <span className="flex-1">{v}</span>
            </button>
          ))}
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="self-start px-2.5 py-0.5 rounded-lg bg-[#0D5771] text-white text-[10px] font-semibold shadow-md animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
