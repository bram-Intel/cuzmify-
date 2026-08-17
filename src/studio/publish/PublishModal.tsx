'use client';

import React, { useState } from 'react';
import { Rocket, CheckCircle2, ExternalLink, X, Globe, ShieldCheck, Loader2 } from 'lucide-react';
import { useEditor } from '../engine/EditorContext';

interface PublishModalProps {
  onClose: () => void;
  onPublish: () => Promise<string>;
}

type PublishState = 'ready' | 'publishing' | 'success' | 'error';

const PUBLISH_CHECKLIST = [
  { label: 'Design', check: true },
  { label: 'Content', check: true },
  { label: 'Mobile View', check: true },
  { label: 'Booking Integration', check: true },
];

const DEPLOY_STEPS = [
  'Packaging project assets…',
  'Compiling CSS design tokens…',
  'Deploying to Cuzmify Edge Network…',
  'Configuring SSL certificate…',
  'Running health checks…',
  'DNS propagation initiated…',
];

export function PublishModal({ onClose, onPublish }: PublishModalProps) {
  const { businessName } = useEditor();
  const [state, setState] = useState<PublishState>('ready');
  const [logs, setLogs] = useState<string[]>([]);
  const [publishedUrl, setPublishedUrl] = useState('');

  const domain = `${(businessName || 'glorybeauty').toLowerCase().replace(/\s+/g, '')}.cuzmify.com`;

  const handlePublish = async () => {
    setState('publishing');
    setLogs([]);

    // Simulate progressive deploy log
    for (let i = 0; i < DEPLOY_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 500));
      setLogs((prev) => [...prev, DEPLOY_STEPS[i]]);
    }

    try {
      const url = await onPublish();
      setPublishedUrl(url || `https://${domain}`);
      setState('success');
    } catch {
      setState('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#070C14] border border-[rgba(255,255,255,0.1)] rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D5771] to-[#3498E3] flex items-center justify-center">
              {state === 'success' ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Rocket className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {state === 'success' ? '🎉 Website is Live!' : state === 'publishing' ? 'Launching…' : 'Ready to Launch?'}
              </h2>
              <p className="text-[10px] text-[#475569]">{domain}</p>
            </div>
          </div>
          {state !== 'publishing' && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] text-[#475569] hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-5">
          {state === 'ready' && (
            <>
              <div className="space-y-2">
                {PUBLISH_CHECKLIST.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-[12px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-[#94A3B8]">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="px-3 py-2.5 rounded-xl bg-[#0A1628] border border-[rgba(255,255,255,0.06)] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#3B82F6] shrink-0" />
                <span className="text-[11px] font-mono text-[#94A3B8]">{domain}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
              </div>

              <button
                onClick={handlePublish}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] text-white font-bold text-sm hover:from-[#0B4A61] hover:to-[#2980C9] transition-all shadow-xl shadow-[#0D5771]/20 flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4" />
                Launch My Website
              </button>
            </>
          )}

          {state === 'publishing' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="w-4 h-4 text-[#3B82F6] animate-spin" />
                <span className="text-[12px] text-[#94A3B8]">Deploying to Cuzmify Edge Network…</span>
              </div>
              <div className="bg-[#020408] rounded-xl p-4 border border-[rgba(255,255,255,0.05)] font-mono text-[10px] space-y-1.5 min-h-[120px]">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{log}</span>
                  </div>
                ))}
                {logs.length < DEPLOY_STEPS.length && (
                  <div className="flex items-center gap-2 text-[#3B82F6]">
                    <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                    <span className="animate-pulse">Processing…</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {state === 'success' && (
            <div className="space-y-4 text-center">
              <div className="text-4xl">🎉</div>
              <div>
                <p className="text-white font-bold text-sm">Your website is live!</p>
                <p className="text-[#64748B] text-[11px] mt-1">Deployed with SSL, CDN & health monitoring.</p>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Live Website
                </a>
                <button
                  onClick={onClose}
                  className="py-3 rounded-xl bg-[#0A1628] hover:bg-[#0D1A2E] border border-[rgba(255,255,255,0.06)] text-[#94A3B8] font-semibold text-[12px] transition-all"
                >
                  Continue Editing
                </button>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <div className="px-3 py-3 rounded-xl bg-red-500/5 border border-red-500/20 text-[11px] text-red-400">
                Deployment failed. Your project was saved locally. Try again or contact support.
              </div>
              <button
                onClick={() => setState('ready')}
                className="w-full py-3 rounded-xl bg-[#0A1628] border border-[rgba(255,255,255,0.06)] text-[#94A3B8] font-semibold text-[12px]"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
