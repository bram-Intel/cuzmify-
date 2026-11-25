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
  Terminal,
  Copy,
  Wrench,
  Code2,
} from 'lucide-react';
import { useEditor } from '../engine/EditorContext';
import { useSession } from 'next-auth/react';
import type { ThemeName } from '@/core/project-schema';

export interface ToolCallSummary {
  name: string;
  ok: boolean;
  summary: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  changesApplied?: string[];
  executionSteps?: string[];
  toolCalls?: ToolCallSummary[];
  theme?: ThemeName;
  snapshotHtml?: string;
  snapshotBlueprint?: any;
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
    "Hi! I know your active website template, photos, services, and account. Ask me to refine headlines or button copy, adjust colors/fonts, add packages, show/hide sections, or publish live.",
  timestamp: 'Ready',
  executionSteps: [
    'Connected to Gemini MCP Agent, Template Engine & Cloud Account',
  ],
};

const QUICK_ACTIONS = [
  {
    label: '✨ Upgrade Headline & CTA',
    prompt: 'Make my hero headline, bio, and main booking button feel editorial, clear, and trustworthy on my current template',
  },
  {
    label: '🎨 Accent Color & Style',
    prompt: 'Give my current template a warm gold accent (#D97706) with pill-shaped buttons without switching templates',
  },
  {
    label: '💼 Add VIP Package',
    prompt: 'Add a VIP Signature Experience service package priced on quote',
  },
  {
    label: '🚀 Publish Website Live',
    prompt: 'Publish my website live and show me the public link',
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
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [mcpTokenData, setMcpTokenData] = useState<{ endpoint: string; token: string; mcpConfigExample?: any } | null>(null);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [mcpCopied, setMcpCopied] = useState<string | null>(null);
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
    if (messages.length > 1 || isBuilding) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages.length, isBuilding]);

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

    let snapshotBlueprint: any = undefined;
    try {
      const liveBp = service.getBlueprint();
      if (liveBp) snapshotBlueprint = JSON.parse(JSON.stringify(liveBp));
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
          siteId: projectId,
          prompt: cleanPrompt,
          targetElement: activeTarget,
          currentHtml,
          theme,
          plan: (session?.user as any)?.plan === 'pro' ? 'pro' : 'free',
          blueprint: service?.getBlueprint(),
        }),
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        if (!res.ok) {
          throw new Error(`AI Service returned status ${res.status}. Please retry in a moment.`);
        }
        throw new Error(rawText?.slice(0, 120) || 'Unexpected server response format');
      }

      if (!res.ok) {
        throw new Error(data.error || `AI generation failed with status ${res.status}`);
      }

      setBuildPhase('Syncing canvas & persisting to cloud DB…');

      const newTheme = data?.theme || theme;
      if (data?.theme && data.theme !== theme) {
        handleThemeChange(data.theme);
      }

      // ── Apply canvas / blueprint changes based on intent ────────────────────
      if (data?.updatedBlueprint) {
        service.applyExternalBlueprint(data.updatedBlueprint, data?.savedSiteId || projectId);
      } else {
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
      }

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
      if (data?.savedToAccount) {
        setSaveToast(
          data?.published
            ? '🚀 Published live & saved to your account!'
            : '✓ AI updated & saved to your account!'
        );
        setTimeout(() => setSaveToast(null), 2800);
      } else if (data?.updatedBlueprint || data?.updatedHtml || data?.blueprintUpdates) {
        const saved = await service.saveToDatabase(projectId, { businessName, theme: newTheme });
        if (saved) {
          setSaveToast('✓ AI changes saved to Database!');
          setTimeout(() => setSaveToast(null), 2500);
        }
      }

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
        toolCalls: Array.isArray(data.toolCalls) ? data.toolCalls : undefined,
        theme: data.theme,
        snapshotHtml: currentHtml,
        snapshotBlueprint,
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
  const handleRollback = (snapshotHtml?: string, snapshotBp?: any) => {
    if (!service || (!snapshotHtml && !snapshotBp)) return;
    try {
      if (snapshotBp) {
        service.applyExternalBlueprint(snapshotBp, projectId);
      } else if (snapshotHtml) {
        service.loadHtml(snapshotHtml, 'Restored Snapshot State', 'manual_edit', theme);
      }
      service.saveToLocalStorage(projectId, theme, userId);
      service.saveToDatabase(projectId, { businessName, theme });

      setSaveToast('↺ Canvas reverted to snapshot state!');
      setTimeout(() => setSaveToast(null), 3000);

      const rollbackNotice: ChatMessage = {
        id: `rollback-${Date.now()}`,
        role: 'assistant',
        content: '↺ Reverted site back to previous snapshot state.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executionSteps: [
          snapshotBp ? 'Restored blueprint & re-rendered template' : 'Restored HTML snapshot into visual editor',
          'Persisted restored state to database',
        ],
      };

      saveMessages([...messages, rollbackNotice]);
    } catch (err) {
      console.error('[AIPanel] Rollback error:', err);
    }
  };

  const handleToggleMcp = async () => {
    const nextOpen = !showMcpModal;
    setShowMcpModal(nextOpen);
    if (nextOpen && !mcpTokenData && !mcpLoading) {
      setMcpLoading(true);
      try {
        const res = await fetch('/api/mcp/token');
        if (res.ok) {
          const json = await res.json();
          setMcpTokenData(json);
        }
      } catch {
        // ignore network errors
      } finally {
        setMcpLoading(false);
      }
    }
  };

  const handleCopyMcp = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMcpCopied(label);
      setTimeout(() => setMcpCopied(null), 2000);
    } catch {}
  };

  const toggleSteps = (id: string) => {
    setExpandedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col w-full max-w-full rounded-2xl border border-slate-200 overflow-hidden text-slate-800 bg-white shadow-2xs">
      {/* ─── Sleek Status Header ─── */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold text-slate-800 font-display">
            Cuzmify AI Assistant
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleMcp}
            className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
              showMcpModal
                ? 'bg-[#0D5771] text-white border-[#0D5771]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-[#0D5771]/50 hover:text-[#0D5771]'
            }`}
            title="Connect ChatGPT, Claude, or Cursor via Cuzmify MCP Server"
          >
            <Code2 className="w-3 h-3" />
            <span>MCP</span>
          </button>
          <button
            type="button"
            onClick={handleClearHistory}
            className="w-6 h-6 rounded-md hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Optional Cuzmify MCP Server Connection Drawer ─── */}
      {showMcpModal && (
        <div className="px-3 py-2.5 bg-slate-900 text-slate-100 border-b border-slate-800 space-y-2 text-[11px] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <Wrench className="w-3 h-3" />
              Cuzmify MCP Server
            </span>
            <button
              type="button"
              onClick={() => setShowMcpModal(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
              title="Close MCP drawer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {mcpLoading ? (
            <p className="text-[10px] text-slate-400">Generating your MCP credentials…</p>
          ) : mcpTokenData ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 bg-slate-800 px-2 py-1 rounded-lg">
                <span className="truncate font-mono text-[10px] text-slate-200">{mcpTokenData.endpoint}</span>
                <button
                  type="button"
                  onClick={() => handleCopyMcp('endpoint', mcpTokenData.endpoint)}
                  className="text-[10px] font-semibold text-cyan-300 hover:text-white shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  {mcpCopied === 'endpoint' ? 'Copied' : 'URL'}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 bg-slate-800 px-2 py-1 rounded-lg">
                <span className="truncate font-mono text-[10px] text-emerald-300">
                  Bearer {mcpTokenData.token.slice(0, 14)}…
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyMcp('token', mcpTokenData.token)}
                    className="text-[10px] font-semibold text-emerald-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {mcpCopied === 'token' ? 'Copied' : 'Token'}
                  </button>
                  {mcpTokenData.mcpConfigExample && (
                    <button
                      type="button"
                      onClick={() => handleCopyMcp('json', JSON.stringify(mcpTokenData.mcpConfigExample, null, 2))}
                      className="text-[10px] font-semibold text-amber-300 hover:text-white cursor-pointer"
                    >
                      {mcpCopied === 'json' ? 'Copied JSON' : 'Copy JSON'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-snug">
                Paste URL + Bearer token into ChatGPT MCP, Claude, or Cursor to edit your site externally.
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-amber-300">Sign in to generate a personal MCP API token.</p>
          )}
        </div>
      )}

      {/* ─── Messages Feed (Bounded height so it never collapses inside scrollable sidebars) ─── */}
      <div className="min-h-[135px] max-h-[240px] overflow-y-auto custom-scrollbar space-y-3 p-3">
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

                {/* MCP Tool Calls Pill Strip */}
                {!isUser && Array.isArray(m.toolCalls) && m.toolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.toolCalls.map((tc, tIdx) => (
                      <span
                        key={`${tc.name}-${tIdx}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                          tc.ok
                            ? 'bg-cyan-50 text-[#0D5771] border-cyan-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                        title={tc.summary || tc.error || tc.name}
                      >
                        <Wrench className="w-2.5 h-2.5 shrink-0" />
                        <span>{tc.name}</span>
                      </span>
                    ))}
                  </div>
                )}

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
                {!isUser && (m.snapshotHtml || m.snapshotBlueprint) && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleRollback(m.snapshotHtml, m.snapshotBlueprint)}
                      className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-[0.99]"
                      title="Rollback site to the exact state before this edit"
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

      {/* ─── Quick Inspiration Pills (Hidden Scrollbar) ─── */}
      <div className="pt-2 px-2.5 border-t border-slate-200/80 space-y-1.5 shrink-0 bg-slate-50/50">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              type="button"
              onClick={() => handleSend(qa.prompt)}
              disabled={isBuilding}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#0D5771]/10 border border-slate-200 hover:border-[#0D5771]/40 text-[11px] font-medium text-slate-700 hover:text-[#0D5771] whitespace-nowrap transition-all cursor-pointer shrink-0"
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
                ? `Instruct AI on <${targetElement.tagName}> (Enter to send)…`
                : 'Tell AI to update copy, colors, prices, sections, or publish live…'
            }
            className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none px-1 font-medium resize-none min-h-[34px] max-h-[110px] py-1.5 leading-relaxed no-scrollbar"
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
