'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RotateCcw, CheckCircle2, ChevronRight, Layers, Wand2, Compass } from 'lucide-react';
import { useEditor } from '../engine/EditorContext';
import type { ThemeName } from '@/core/project-schema';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  changesApplied?: string[];
  theme?: ThemeName;
  snapshotHtml?: string;
}

const INITIAL_WELCOME: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content: "I'm your Autonomous AI Website Architect. Tell me what business you're building, request a complete redesign, or ask to add/restructure any section with full creative autonomy.",
  timestamp: 'Just now',
};

const QUICK_ACTIONS = [
  { label: 'Supercar Rental Club (Monaco)', prompt: 'Redesign into an ultra-luxury Supercar Rental Club in Monaco with dark carbon aesthetics and 3 membership tiers' },
  { label: 'Bespoke Bridal Atelier', prompt: 'Transform into a bespoke luxury bridal studio with packages for destination weddings and airbrush makeup' },
  { label: 'Medical Aesthetic Clinic', prompt: 'Turn into a certified clinical dermatology and aesthetic skin rejuvenation clinic with HydraFacials and laser peels' },
  { label: 'Add 3-Tier Pricing Table', prompt: 'Add an interactive 3-tier pricing comparison section with a signature VIP plan highlighted' },
  { label: 'Add WhatsApp Booking Hotline', prompt: 'Add a dedicated 24/7 instant WhatsApp reservation and consultation hotline section' },
];

export function AIPanel() {
  const { service, theme, businessName, projectId, setSaveToast, handleThemeChange } = useEditor();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildPhase, setBuildPhase] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBuilding]);

  const handleSend = async (userPromptText: string = inputPrompt) => {
    const cleanPrompt = userPromptText.trim();
    if (!cleanPrompt || !service || isBuilding) return;

    // 1. Take current snapshot for undo capability
    let currentHtml = '';
    try {
      currentHtml = service.getHtml();
    } catch {
      // ignore
    }

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: cleanPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsBuilding(true);

    // Multi-stage progress indicators
    setBuildPhase('🧠 Architecting layout & business logic…');

    try {
      setTimeout(() => setBuildPhase('🎨 Rendering bespoke components & themes…'), 1200);
      setTimeout(() => setBuildPhase('⚡ Polishing typography & micro-animations…'), 2400);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          currentHtml,
          theme,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI generation failed with status ${res.status}`);
      }

      const data = await res.json();
      setBuildPhase('✨ Injecting into live canvas…');

      if (data?.updatedHtml) {
        // 2. Load the transformed HTML directly into the GrapesJS canvas
        service.loadHtml(data.updatedHtml);
        setTimeout(() => {
          service.highlightSection('hero');
        }, 150);
      }

      const newTheme = data?.theme || theme;
      if (data?.theme) {
        handleThemeChange(data.theme);
      }

      // Immediately save AI transformation to Database and LocalStorage
      service.saveToLocalStorage(projectId, newTheme);
      service.saveToDatabase(projectId, { businessName, theme: newTheme }).then((saved) => {
        if (saved) {
          setSaveToast('✓ AI Transformation saved to Database!');
        }
      });

      try {
        window.dispatchEvent(new CustomEvent('cuzmify:ai-transformed', { detail: { theme: newTheme } }));
      } catch {}

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.aiReply || 'Website transformed successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        changesApplied: data.changesApplied || [],
        theme: data.theme,
        snapshotHtml: currentHtml, // previous snapshot
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[AIPanel] Generation error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Failed to complete transformation. Please check your network or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsBuilding(false);
      setBuildPhase(null);
    }
  };

  const handleRollback = (snapshotHtml?: string) => {
    if (!service || !snapshotHtml) return;
    try {
      service.loadHtml(snapshotHtml);
      setMessages((prev) => [
        ...prev,
        {
          id: `rollback-${Date.now()}`,
          role: 'assistant',
          content: '✓ Reverted canvas back to previous snapshot.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('[AIPanel] Rollback error:', err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full max-w-full overflow-hidden text-[#1A202C]">
      {/* Header info */}
      <div className="flex items-center justify-between px-1 py-1.5 border-b border-[#E2E8F0] mb-2 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#0D5771]">
          <Sparkles className="w-3.5 h-3.5 text-[#0D5771] animate-pulse" />
          <span>AUTONOMOUS AI STUDIO (GEMINI)</span>
        </div>
        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Live Model
        </span>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 pb-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col gap-1.5 ${
              m.role === 'user' ? 'items-end' : 'items-start'
            } animate-in fade-in duration-150`}
          >
            <div className="flex items-center gap-1.5 text-[9px] text-[#94A3B8] font-mono px-1">
              <span>{m.role === 'user' ? 'You' : '✦ Cuzmify AI'}</span>
              <span>•</span>
              <span>{m.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[95%] ${
                m.role === 'user'
                  ? 'bg-[#0D5771] text-white rounded-tr-xs shadow-xs font-medium'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#1A202C] rounded-tl-xs shadow-2xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>

              {/* Changes applied checklist */}
              {m.changesApplied && m.changesApplied.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] space-y-1">
                  <span className="text-[9px] font-mono font-bold text-[#0D5771] uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#0D5771]" />
                    <span>Applied Changes</span>
                  </span>
                  {m.changesApplied.map((ch, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{ch}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 1-Click Rollback per Message */}
              {m.snapshotHtml && (
                <div className="mt-2 pt-1.5 flex justify-end">
                  <button
                    onClick={() => handleRollback(m.snapshotHtml)}
                    className="flex items-center gap-1 text-[9px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg border border-amber-200 transition-all cursor-pointer"
                    title="Rollback canvas to before this change"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Undo to snapshot</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live Building Phase Indicator */}
        {isBuilding && (
          <div className="p-3 rounded-2xl bg-[#0D5771]/5 border border-[#0D5771]/20 flex flex-col gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-[#0D5771] animate-spin" />
              <span className="text-[11px] font-bold text-[#0D5771]">{buildPhase}</span>
            </div>
            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
              <div className="bg-[#0D5771] h-full rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Actions */}
      <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5 shrink-0">
        <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-[#64748B] uppercase">
          <Compass className="w-3 h-3 text-[#64748B]" />
          <span>Quick Inspiration</span>
        </div>
        <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              onClick={() => handleSend(qa.prompt)}
              disabled={isBuilding}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-[#0D5771]/40 text-[10px] font-semibold text-[#1A202C] hover:text-[#0D5771] whitespace-nowrap transition-all shadow-2xs cursor-pointer shrink-0"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input Box */}
      <div className="pt-2 shrink-0">
        <div className="flex items-center gap-1.5 p-2 rounded-2xl bg-white border border-[#E2E8F0] focus-within:border-[#0D5771] focus-within:shadow-md transition-all">
          <input
            type="text"
            id="autonomous-ai-chat-input"
            name="autonomousAiChatInput"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI to transform site, add pricing table, change layout…"
            className="flex-1 bg-transparent text-[11px] text-[#1A202C] placeholder-[#94A3B8] outline-none px-1"
            disabled={isBuilding}
            suppressHydrationWarning
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isBuilding}
            className="p-1.5 rounded-xl bg-[#0D5771] hover:bg-[#083D50] disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all cursor-pointer shrink-0"
            title="Send to AI"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
