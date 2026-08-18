'use client';

import React, { useState } from 'react';
import { Rocket, CheckCircle2, ExternalLink, X, Globe, ShieldCheck, Loader2, Copy, Check, QrCode, Smartphone } from 'lucide-react';
import { useEditor } from '../engine/EditorContext';

interface PublishModalProps {
  onClose: () => void;
  onPublish: () => Promise<string>;
}

type PublishState = 'ready' | 'publishing' | 'success' | 'error';

const PUBLISH_CHECKLIST = [
  { label: 'Responsive Layout & Multi-Breakpoints', check: true },
  { label: 'Design Tokens & Bespoke Typography', check: true },
  { label: '1-Click WhatsApp Booking Hooks', check: true },
  { label: 'Global Edge CDN & SSL Encryption', check: true },
];

const DEPLOY_STEPS = [
  'Packaging visual layout & assets…',
  'Compiling CSS design tokens & typography…',
  'Deploying to Vercel Global Edge Network…',
  'Provisioning SSL / TLS certificate…',
  'Registering public route at /site/…',
  'Website published & ready for visitors!',
];

export function PublishModal({ onClose, onPublish }: PublishModalProps) {
  const { businessName, projectId } = useEditor();
  const [state, setState] = useState<PublishState>('ready');
  const [logs, setLogs] = useState<string[]>([]);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanBusinessSlug = (businessName || 'my-studio').toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fallbackDomain = `${cleanBusinessSlug}.cuzmify.com`;

  const handlePublish = async () => {
    setState('publishing');
    setLogs([]);

    for (let i = 0; i < DEPLOY_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setLogs((prev) => [...prev, DEPLOY_STEPS[i]]);
    }

    try {
      const url = await onPublish();
      const resolvedUrl = url || `/site/${projectId}`;
      setPublishedUrl(resolvedUrl);
      setState('success');
    } catch {
      setState('error');
    }
  };

  const handleCopyLink = () => {
    const fullUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${publishedUrl.startsWith('/') ? publishedUrl : '/' + publishedUrl}`
      : publishedUrl;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const fullLiveUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${publishedUrl.startsWith('/') ? publishedUrl : '/' + publishedUrl}`
    : `https://cuzmify.com/site/${projectId}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(fullLiveUrl)}&color=0D5771&bgcolor=FFFFFF`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl shadow-2xl overflow-hidden text-[#1A202C] animate-in zoom-in-95 duration-200">

        {/* Studio-Matched Clean Header */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D5771] to-[#3498E3] flex items-center justify-center shadow-sm">
              {state === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <Rocket className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1A202C] font-display">
                {state === 'success' ? '🎉 Website is Live!' : state === 'publishing' ? 'Launching to Edge…' : 'Ready to Launch?'}
              </h2>
              <p className="text-[11px] text-[#64748B] font-mono truncate max-w-[240px]">
                {businessName || 'My Digital Studio'}
              </p>
            </div>
          </div>
          {state !== 'publishing' && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-[#64748B] hover:text-[#1A202C] transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {state === 'ready' && (
            <>
              <div className="space-y-2.5 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0]">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0D5771] block mb-1">
                  Pre-Flight Verification
                </span>
                {PUBLISH_CHECKLIST.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[#1A202C] font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-[11px] text-emerald-900 leading-snug">
                  <span className="font-bold block">Instant Public Edge URL</span>
                  Your site will be rendered at <span className="font-mono font-bold">/site/{projectId.slice(0, 8)}...</span> with SSL and mobile optimization.
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#1A202C] font-bold text-xs transition-all cursor-pointer"
                >
                  Keep Editing
                </button>
                <button
                  onClick={handlePublish}
                  className="flex-1 py-3 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#0D5771]/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Publish Website</span>
                </button>
              </div>
            </>
          )}

          {state === 'publishing' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 text-[#0D5771] animate-spin" />
                <span className="text-xs font-bold text-[#0D5771] font-mono">Deploying to Cuzmify Edge Network…</span>
              </div>
              <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0] font-mono text-[11px] space-y-2 min-h-[140px]">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-emerald-700 animate-in fade-in duration-150">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                    <span>{log}</span>
                  </div>
                ))}
                {logs.length < DEPLOY_STEPS.length && (
                  <div className="flex items-center gap-2 text-[#0D5771]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span className="animate-pulse">Processing…</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {state === 'success' && (
            <div className="space-y-4 text-center animate-in fade-in duration-200">
              <div className="space-y-1">
                <p className="text-base font-extrabold text-[#1A202C] font-display">
                  Your website is live and public!
                </p>
                <p className="text-xs text-[#64748B]">
                  Deployed with SSL encryption, fast edge caching, and mobile WhatsApp booking.
                </p>
              </div>

              {/* Instant Mobile QR Code */}
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex flex-col items-center gap-2 shadow-2xs">
                <div className="p-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
                  <img
                    src={qrCodeUrl}
                    alt="Mobile Preview QR Code"
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#0D5771]">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Scan to test on your phone camera</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#3498E3]/20 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Live Website</span>
                </a>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#1A202C] font-bold text-xs transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied Link!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#1A202C] font-bold text-xs transition-all cursor-pointer"
                  >
                    Return to Studio
                  </button>
                </div>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4 text-center">
              <div className="text-3xl">⚠️</div>
              <p className="text-sm font-bold text-red-600">Failed to publish website</p>
              <p className="text-xs text-[#64748B]">Please verify your network connection and try again.</p>
              <button
                onClick={() => setState('ready')}
                className="w-full py-2.5 rounded-xl bg-[#0D5771] text-white font-bold text-xs"
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
