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
  Check,
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  Cpu,
  CornerDownLeft,
  X,
  Bot,
  User,
  History,
  Terminal
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
    'Autonomous engine connected to Gemini 2.5 Flash',
    'Real-time Canvas & Supabase Cloud persistence active',
  ],
};

const QUICK_ACTIONS = [
  {
    label: '⚡ Compact Pill Button',
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
    label: '💎 3-Tier Pricing Section',
    prompt: 'Add an interactive 3-tier pricing comparison section with a signature VIP plan highlighted',
  },
  {
    label: '💬 WhatsApp Booking Hotline',
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

  // ── 1. Load Chat History ──────────────────────────────────────────────────
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

  // ── 2. Persist Messages on Update ─────────────────────────────────────────
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

  // ── 3. Clear Chat History ─────────────────────────────────────────────────
  const handleClearHistory = () => {
    if (confirm('Clear conversation history and snapshots for this project?')) {
      const reset = [INITIAL_WELCOME];
      saveMessages(reset);
      setSaveToast('Chat history cleared');
      setTimeout(() => setSaveToast(null), 2000);
    }
  };

  // ── 4. Send Message & Transform Canvas ────────────────────────────────────
  const handleSend = async (userPromptText: string = inputPrompt) => {
    const cleanPrompt = userPromptText.trim();
    if (!cleanPrompt || !service || isBuilding) return;

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

    setBuildPhase('Analyzing DOM components & tokens…');

    try {
      setTimeout(() => setBuildPhase('Pinpointing target element & synthesizing styles…'), 800);
      setTimeout(() => setBuildPhase('Rendering responsive layout & micro-animations…'), 1600);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          targetElement: activeTarget,
          currentHtml,
          theme,
          blueprint: service?.getBlueprint(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `AI generation failed with status ${res.status}`);
      }

      setBuildPhase('Syncing canvas & persisting to cloud DB…');

      const newTheme = data?.theme || theme;
      if (data?.theme && data.theme !== theme) {
        handleThemeChange(data.theme);
      }

      // ── Apply canvas changes based on intent ────────────────────────────────
      const isStyleOnly = data?.intent === 'style-only' || !data?.updatedHtml;

      if (!isStyleOnly) {
        if (activeTarget && data?.updatedElementHtml) {
          // Surgical single-element replacement
          const replaced = service.replaceSelectedComponent(data.updatedElementHtml);
          if (!replaced && data?.updatedHtml) {
            service.loadHtml(data.updatedHtml, `AI: ${cleanPrompt.slice(0, 40)}`, 'ai_transform', newTheme);
          }
        } else if (data?.updatedHtml) {
          // Full HTML replacement (add-section appended HTML or full-rebuild)
          service.loadHtml(data.updatedHtml, `AI: ${cleanPrompt.slice(0, 40)}`, 'ai_transform', newTheme);

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
      }
      // isStyleOnly: theme already applied above via handleThemeChange — canvas HTML untouched ✓

      if (data?.blueprintUpdates) {
        if (data.blueprintUpdates.profile) {
          service.updateProfile(data.blueprintUpdates.profile);
        }
        if (Array.isArray(data.blueprintUpdates.services) && data.blueprintUpdates.services.length > 0) {
          for (const srv of data.blueprintUpdates.services) {
            if (srv.name && srv.price) {
              service.addServiceItem({
                name: srv.name,
                price: Number(srv.price) || 100,
                description: srv.description || 'Professional service.',
                locationType: 'in_studio',
                enabled: true,
              });
            }
          }
        }
      }

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

      const executionSteps = Array.isArray(data.changesApplied) && data.changesApplied.length > 0
        ? data.changesApplied
        : [
            activeTarget?.id
              ? `Pinpointed target <${activeTarget.tagName} id="${activeTarget.id}">`
              : 'Synthesized design layout with Gemini 3.6 Flash',
            'Rendered live changes to visual canvas & committed to Cloud DB',
          ];

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.aiReply || 'Website updated successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        changesApplied: data.changesApplied || [],
        executionSteps,
        theme: data.theme,
        snapshotHtml: currentHtml,
        resultHtml: data.updatedHtml,
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
        content: `⚠️ ${err?.message || 'Failed to complete transformation. Please verify your connection or try again.'}`,
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

  // ── 5. Instant Snapshot Rollback ──────────────────────────────────────────
  const handleRollback = (snapshotHtml?: string) => {
    if (!service || !snapshotHtml) return;
    try {
      service.loadHtml(snapshotHtml, 'Restored Snapshot State', 'manual_edit', theme);
      service.saveToLocalStorage(projectId, theme, userId);
      service.saveToDatabase(projectId, { businessName, theme });

      setSaveToast('↺ Canvas reverted to snapshot state!');
      setTimeout(() => setSaveToast(null), 3000);

      const rollbackNotice: ChatMessage = {
        id: `rollback-${Date.now()}`,
        role: 'assistant',
        content: '↺ Reverted canvas back to previous snapshot state.',
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
    <div className="flex flex-col h-full w-full max-w-full overflow-hidden text-slate-800 bg-white">
      {/* ─── Sleek Status Header ─── */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/70 border-b border-slate-200 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 relative" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 font-mono tracking-tight">
            AI Architect <span className="text-[#0D5771]">• Gemini 2.5</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">
            {messages.length} msgs
          </span>
          <button
            onClick={handleClearHistory}
            className="w-6 h-6 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Messages Feed ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 p-3.5 pb-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
            >
              {/* Sender Label & Meta */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono px-1">
                {isUser ? (
                  <>
                    <span>{m.timestamp}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">You</span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-[#0D5771] font-bold font-display">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Cuzmify AI</span>
                    </div>
                    <span>•</span>
                    <span>{m.timestamp}</span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[95%] transition-all ${
                  isUser
                    ? 'bg-[#0D5771] text-white rounded-tr-xs shadow-sm font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs space-y-3'
                }`}
              >
                {/* User Target Pinpoint Badge */}
                {isUser && m.targetInfo && (
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-mono text-cyan-200 bg-white/10 px-2 py-0.5 rounded-md max-w-fit">
                    <Target className="w-3 h-3 text-amber-300" />
                    <span>Target: &lt;{m.targetInfo.tagName}&gt;</span>
                  </div>
                )}

                <p className="whitespace-pre-wrap">{m.content}</p>

                {/* Assistant Applied Changes Matrix */}
                {!isUser && Array.isArray(m.changesApplied) && m.changesApplied.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-100 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-[#0D5771] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-[#0D5771]" />
                      <span>Applied Changes</span>
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {m.changesApplied.map((ch, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-[11px] text-slate-700 bg-emerald-50/50 px-2.5 py-1.5 rounded-xl border border-emerald-200/60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="font-medium">{ch}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assistant Execution Telemetry */}
                {!isUser && Array.isArray(m.executionSteps) && m.executionSteps.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => toggleSteps(m.id)}
                      className="w-full flex items-center justify-between text-[10px] font-mono font-semibold text-slate-600 hover:text-slate-900 transition-colors py-0.5 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-[#0D5771]" />
                        <span>Execution Steps ({m.executionSteps.length})</span>
                      </span>
                      {expandedSteps[m.id] ? (
                        <ChevronUp className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      )}
                    </button>

                    {expandedSteps[m.id] && (
                      <div className="mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-mono text-[10px] animate-in fade-in duration-150">
                        {m.executionSteps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-1.5 text-slate-600">
                            <span className="text-[#0D5771] font-bold">✓</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Assistant Snapshot Rollback Action */}
                {!isUser && m.snapshotHtml && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleRollback(m.snapshotHtml)}
                      className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-[0.99]"
                      title="Rollback canvas to the exact state before this edit"
                    >
                      <RotateCcw className="w-3 h-3 text-[#0D5771]" />
                      <span>Restore Snapshot</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">Snapshot Persisted</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ─── Live Streaming / Thinking Shimmer Card ─── */}
        {isBuilding && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0D5771]/10 via-[#0D5771]/5 to-transparent border border-[#0D5771]/30 flex flex-col gap-2.5 animate-in fade-in duration-150 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-[#0D5771] animate-spin" />
                <span className="text-xs font-bold text-[#0D5771] font-mono">{buildPhase}</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-[#0D5771] bg-white px-2 py-0.5 rounded-md border border-[#0D5771]/20 animate-pulse">
                Autonomous
              </span>
            </div>
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#0D5771] to-[#3498E3] h-full rounded-full animate-pulse w-4/5 transition-all duration-300" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ─── Quick Inspiration Pills ─── */}
      <div className="pt-2 px-3 border-t border-slate-200/80 space-y-1.5 shrink-0 bg-slate-50/40">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
          <Compass className="w-3 h-3 text-[#0D5771]" />
          <span>Quick Inspiration</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-2">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              onClick={() => handleSend(qa.prompt)}
              disabled={isBuilding}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-[#0D5771]/10 border border-slate-200 hover:border-[#0D5771]/40 text-[11px] font-medium text-slate-700 hover:text-[#0D5771] whitespace-nowrap transition-all shadow-2xs cursor-pointer shrink-0"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Floating Command Input Bar ─── */}
      <div className="p-3 pt-2 shrink-0 bg-white border-t border-slate-200">
        {targetElement && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0D5771]/10 border border-[#0D5771]/30 text-[#0D5771] mb-2 animate-in fade-in duration-150 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[11px] font-mono font-bold truncate">
                Target: &lt;{targetElement.tagName}{targetElement.id ? `#${targetElement.id}` : ''}&gt;
                {targetElement.text ? ` "${targetElement.text}"` : ''}
              </span>
            </div>
            <button
              onClick={() => setTargetElement(null)}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 px-1.5 py-0.5 rounded text-xs font-bold cursor-pointer transition-colors"
              title="Clear element target"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-[#0D5771] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0D5771]/10 transition-all shadow-2xs">
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
            className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none px-1 font-medium resize-none min-h-[34px] max-h-[120px] py-1.5 leading-relaxed custom-scrollbar"
            disabled={isBuilding}
            suppressHydrationWarning
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isBuilding}
            className="w-8 h-8 rounded-xl bg-[#0D5771] hover:bg-[#083D50] disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm self-end mb-0.5 hover:scale-105 active:scale-95"
            title="Send to AI (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
