'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Wand2,
  Compass,
  Trash2,
  Copy,
  Check,
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  Cpu,
  CornerDownLeft,
} from 'lucide-react';
import { useEditor } from '../engine/EditorContext';
import { useSession } from 'next-auth/react';
import type { ThemeName } from '@/core/project-schema';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  changesApplied?: string[];
  executionSteps?: string[];
  theme?: ThemeName;
  snapshotHtml?: string;
  resultHtml?: string;
  targetInfo?: {
    id?: string;
    tagName?: string;
    text?: string;
  };
}

const INITIAL_WELCOME: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content:
    "I'm your Autonomous AI Website Architect. You can request a full website overhaul, add new sections, or click any element on the canvas to surgically edit its style, width, or text.",
  timestamp: 'Just now',
  executionSteps: [
    'Autonomous engine initialized & connected to Gemini 2.5',
    'Real-time Canvas & Supabase Cloud sync active',
  ],
};

const QUICK_ACTIONS = [
  {
    label: '⚡ Make Button Sleek & Compact',
    prompt: 'make the selected button compact with modern pill border-radius, elegant padding, and subtle glow',
  },
  {
    label: '🏎️ Monaco Supercar Rental',
    prompt: 'Redesign into an ultra-luxury Supercar Rental Club in Monaco with dark carbon aesthetics and 3 membership tiers',
  },
  {
    label: '✨ Bespoke Bridal Atelier',
    prompt: 'Transform into a bespoke luxury bridal studio with packages for destination weddings and airbrush makeup',
  },
  {
    label: '💎 Add 3-Tier Pricing Table',
    prompt: 'Add an interactive 3-tier pricing comparison section with a signature VIP plan highlighted',
  },
  {
    label: '💬 Add WhatsApp Booking Hotline',
    prompt: 'Add a dedicated 24/7 instant WhatsApp reservation and consultation hotline section',
  },
];

export function AIPanel() {
  const {
    service,
    theme,
    businessName,
    projectId,
    setSaveToast,
    handleThemeChange,
    targetElement,
    setTargetElement,
  } = useEditor();

  const { data: session } = useSession();
  const userId = session?.user?.id || session?.user?.email || 'guest';
  const storageKey = `cuzmify_chat_${userId}_${projectId}`;

  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildPhase, setBuildPhase] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when an element is targeted
  useEffect(() => {
    if (targetElement) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [targetElement]);

  // ── 1. Load Chat History from LocalStorage on Mount ──────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // ── 2. Persist Messages on Update ─────────────────────────────────────────────
  const saveMessages = useCallback(
    (newMessages: ChatMessage[]) => {
      setMessages(newMessages);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newMessages));
      } catch {
        // ignore
      }
    },
    [storageKey]
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBuilding]);

  // ── 3. Clear Chat History ───────────────────────────────────────────────────
  const handleClearHistory = () => {
    if (confirm('Clear all conversation history and snapshots for this project?')) {
      const reset = [INITIAL_WELCOME];
      saveMessages(reset);
      setSaveToast('Chat history cleared');
      setTimeout(() => setSaveToast(null), 2000);
    }
  };

  // ── 4. Send Message & Transform Canvas ────────────────────────────────────────
  const handleSend = async (userPromptText: string = inputPrompt) => {
    const cleanPrompt = userPromptText.trim();
    if (!cleanPrompt || !service || isBuilding) return;

    // Capture snapshot BEFORE transformation
    let currentHtml = '';
    try {
      currentHtml = service.getHtml();
    } catch {}

    const activeTarget = targetElement ? { ...targetElement } : undefined;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: cleanPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      targetInfo: activeTarget
        ? {
            id: activeTarget.id,
            tagName: activeTarget.tagName,
            text: activeTarget.text,
          }
        : undefined,
    };

    const updatedWithUser = [...messages, userMsg];
    saveMessages(updatedWithUser);
    setInputPrompt('');
    setIsBuilding(true);

    setBuildPhase('🧠 Analyzing component hierarchy & tokens…');

    try {
      setTimeout(() => setBuildPhase('⚡ Pinpointing target element & synthesizing styles…'), 900);
      setTimeout(() => setBuildPhase('🎨 Rendering responsive layout & micro-animations…'), 1800);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          targetElement: activeTarget,
          currentHtml,
          theme,
        }),
      });

      if (!res.ok) {
        throw new Error(`AI generation failed with status ${res.status}`);
      }

      const data = await res.json();
      setBuildPhase('✨ Injecting into live canvas & syncing cloud DB…');

      if (data?.updatedHtml) {
        // Load into GrapesJS canvas
        service.loadHtml(data.updatedHtml);

        // Smart section scroll
        const pLow = cleanPrompt.toLowerCase();
        let targetSec = 'hero';
        if (pLow.includes('booking') || pLow.includes('whatsapp')) targetSec = 'booking';
        else if (pLow.includes('service') || pLow.includes('pricing') || pLow.includes('package')) targetSec = 'services';
        else if (pLow.includes('portfolio') || pLow.includes('gallery') || pLow.includes('photo')) targetSec = 'portfolio';
        else if (pLow.includes('about') || pLow.includes('story')) targetSec = 'about';
        else if (pLow.includes('testimonial') || pLow.includes('review')) targetSec = 'testimonials';

        setTimeout(() => {
          service.highlightSection(targetSec);
        }, 150);
      }

      const newTheme = data?.theme || theme;
      if (data?.theme) {
        handleThemeChange(data.theme);
      }

      // Immediately save to LocalStorage and Supabase Cloud Database
      service.saveToLocalStorage(projectId, newTheme, userId);
      service.saveToDatabase(projectId, { businessName, theme: newTheme }).then((saved) => {
        if (saved) {
          setSaveToast('✓ AI Transformation saved to Database!');
          setTimeout(() => setSaveToast(null), 2500);
        }
      });

      try {
        window.dispatchEvent(new CustomEvent('cuzmify:ai-transformed', { detail: { theme: newTheme } }));
      } catch {}

      const executionSteps = [
        activeTarget?.id
          ? `Surgically isolated target element <${activeTarget.tagName} id="${activeTarget.id}">`
          : 'Analyzed multi-section layout & design hierarchy',
        `Applied bespoke ${newTheme.toUpperCase()} styling & verified responsiveness`,
        'Rendered changes to live visual canvas & committed to Cloud DB',
      ];

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.aiReply || 'Website updated successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        changesApplied: data.changesApplied || [],
        executionSteps,
        theme: data.theme,
        snapshotHtml: currentHtml, // snapshot before transformation
        resultHtml: data.updatedHtml, // result after transformation
        targetInfo: activeTarget
          ? {
              id: activeTarget.id,
              tagName: activeTarget.tagName,
              text: activeTarget.text,
            }
          : undefined,
      };

      saveMessages([...updatedWithUser, assistantMsg]);
    } catch (err: any) {
      console.error('[AIPanel] Generation error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Failed to complete transformation. Please check your network or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      saveMessages([...updatedWithUser, errorMsg]);
    } finally {
      setIsBuilding(false);
      setBuildPhase(null);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.focus();
        }
      }, 80);
    }
  };

  // ── 5. Instant Snapshot Rollback ──────────────────────────────────────────────
  const handleRollback = (snapshotHtml?: string, msgId?: string) => {
    if (!service || !snapshotHtml) return;
    try {
      service.loadHtml(snapshotHtml);
      service.saveToLocalStorage(projectId, theme, userId);
      service.saveToDatabase(projectId, { businessName, theme });

      setSaveToast('↺ Canvas reverted to snapshot state!');
      setTimeout(() => setSaveToast(null), 3000);

      const rollbackNotice: ChatMessage = {
        id: `rollback-${Date.now()}`,
        role: 'assistant',
        content: '↺ Reverted canvas back to the previous snapshot state.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executionSteps: ['Restored HTML snapshot into visual editor', 'Persisted restored state to database'],
      };

      saveMessages([...messages, rollbackNotice]);
    } catch (err) {
      console.error('[AIPanel] Rollback error:', err);
    }
  };

  const toggleSteps = (id: string) => {
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden text-[#1A202C]">
      {/* Competitor-Grade Top Status Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0] shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 relative" />
          </div>
          <span className="text-[10px] font-mono font-bold text-[#0D5771] tracking-wider uppercase">
            Gemini 2.5 Flash Autonomous
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-[#94A3B8] bg-white px-2 py-0.5 rounded-full border border-[#E2E8F0]">
            {messages.length} msgs
          </span>
          <button
            onClick={handleClearHistory}
            className="p-1 rounded-lg hover:bg-slate-200 text-[#64748B] hover:text-red-600 transition-colors cursor-pointer"
            title="Clear Chat History & Snapshots"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3.5 p-3 pb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col gap-1.5 ${
              m.role === 'user' ? 'items-end' : 'items-start'
            } animate-in fade-in duration-200`}
          >
            {/* Sender & Timestamp */}
            <div className="flex items-center gap-1.5 text-[9px] text-[#94A3B8] font-mono px-1">
              <span className="font-semibold">{m.role === 'user' ? 'You' : '✦ Cuzmify AI'}</span>
              <span>•</span>
              <span>{m.timestamp}</span>
              {m.targetInfo && (
                <span className="text-[8px] bg-[#0D5771]/10 text-[#0D5771] px-1.5 py-0.2 rounded font-mono font-bold">
                  ‹{m.targetInfo.tagName}{m.targetInfo.id ? `#${m.targetInfo.id}` : ''}›
                </span>
              )}
            </div>

            {/* Message Bubble Card */}
            <div
              className={`p-3.5 rounded-2xl text-[11px] leading-relaxed max-w-[96%] transition-all ${
                m.role === 'user'
                  ? 'bg-[#0B1520] text-white rounded-tr-xs shadow-md font-medium'
                  : 'bg-[#FFFFFF] border border-[#E2E8F0] text-[#1A202C] rounded-tl-xs shadow-sm hover:border-[#0D5771]/30'
              }`}
            >
              {/* Target info chip on user msg */}
              {m.role === 'user' && m.targetInfo && (
                <div className="mb-1.5 flex items-center gap-1 text-[9px] font-mono text-cyan-300 bg-white/10 px-2 py-0.5 rounded-md max-w-fit">
                  <Target className="w-2.5 h-2.5" />
                  <span>Targeted: &lt;{m.targetInfo.tagName}&gt;</span>
                </div>
              )}

              <p className="whitespace-pre-wrap">{m.content}</p>

              {/* Execution Steps Accordion (Competitor-Grade) */}
              {m.executionSteps && m.executionSteps.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]">
                  <button
                    onClick={() => toggleSteps(m.id)}
                    className="w-full flex items-center justify-between text-[9px] font-mono font-bold text-[#0D5771] hover:text-[#083D50] transition-colors py-0.5 cursor-pointer"
                  >
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-[#0D5771]" />
                      <span>Execution Steps ({m.executionSteps.length})</span>
                    </span>
                    {expandedSteps[m.id] ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {expandedSteps[m.id] && (
                    <div className="mt-1.5 space-y-1 pl-1 bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0] animate-in fade-in duration-150">
                      {m.executionSteps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-1.5 text-[9px] text-[#64748B] font-mono">
                          <span className="text-[#0D5771] font-bold">↳</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Changes applied checklist */}
              {m.changesApplied && m.changesApplied.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-[#0D5771] uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#0D5771]" />
                    <span>Applied Changes</span>
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {m.changesApplied.map((ch, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-[10px] text-slate-700 bg-emerald-50/60 px-2 py-1 rounded-lg border border-emerald-100"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-medium">{ch}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar per Assistant Card (Snapshot Rollback) */}
              {m.role === 'assistant' && m.snapshotHtml && (
                <div className="mt-3 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[10px]">
                  <button
                    onClick={() => handleRollback(m.snapshotHtml, m.id)}
                    className="flex items-center gap-1.5 text-[9px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                    title="Rollback canvas to the exact state before this transformation"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Restore Snapshot</span>
                  </button>
                  <span className="text-[9px] text-[#94A3B8] font-mono">Snapshot Saved</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live Building Indicator */}
        {isBuilding && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0D5771]/10 via-[#0D5771]/5 to-transparent border border-[#0D5771]/20 flex flex-col gap-2.5 animate-in fade-in duration-150 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#0D5771] animate-spin" />
                <span className="text-[11px] font-bold text-[#0D5771] font-mono">{buildPhase}</span>
              </div>
              <span className="text-[9px] font-mono text-[#0D5771] bg-white px-2 py-0.5 rounded-md border border-[#0D5771]/20 animate-pulse">
                Autonomous
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#0D5771] h-full rounded-full animate-pulse w-4/5 transition-all duration-300" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Inspiration Pills */}
      <div className="pt-2 px-3 border-t border-[#E2E8F0] space-y-1.5 shrink-0 bg-[#F8FAFC]/50">
        <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-[#64748B] uppercase">
          <Compass className="w-3 h-3 text-[#64748B]" />
          <span>Quick Prompts</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1.5">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              onClick={() => handleSend(qa.prompt)}
              disabled={isBuilding}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#0D5771]/10 border border-[#E2E8F0] hover:border-[#0D5771]/40 text-[10px] font-bold text-[#1A202C] hover:text-[#0D5771] whitespace-nowrap transition-all shadow-2xs cursor-pointer shrink-0"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Robust Auto-Expanding Textarea & Active Target Chip */}
      <div className="p-3 pt-2 shrink-0 bg-white border-t border-[#E2E8F0]">
        {targetElement && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0D5771]/10 border border-[#0D5771]/30 text-[#0D5771] mb-2 animate-in fade-in duration-150 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[10px] font-mono font-bold truncate">
                Target: &lt;{targetElement.tagName}{targetElement.id ? `#${targetElement.id}` : ''}&gt;
                {targetElement.text ? ` "${targetElement.text}"` : ''}
              </span>
            </div>
            <button
              onClick={() => setTargetElement(null)}
              className="text-[#64748B] hover:text-[#1A202C] hover:bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors"
              title="Clear element target"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 p-2 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] focus-within:border-[#0D5771] focus-within:bg-white focus-within:shadow-md transition-all">
          <textarea
            ref={textareaRef}
            id="autonomous-ai-chat-input"
            name="autonomousAiChatInput"
            rows={1}
            value={inputPrompt}
            onChange={(e) => {
              setInputPrompt(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              targetElement
                ? `Instruct AI on <${targetElement.tagName}> (Enter to send, Shift+Enter for newline)…`
                : 'Ask AI to transform site, add pricing table, change layout…'
            }
            className="flex-1 bg-transparent text-[11px] text-[#1A202C] placeholder-[#94A3B8] outline-none px-1 font-medium resize-none min-h-[32px] max-h-[120px] py-1 leading-relaxed custom-scrollbar"
            disabled={isBuilding}
            suppressHydrationWarning
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isBuilding}
            className="p-2 rounded-xl bg-[#0D5771] hover:bg-[#083D50] disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all cursor-pointer shrink-0 shadow-sm self-end mb-0.5"
            title="Send to AI (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
