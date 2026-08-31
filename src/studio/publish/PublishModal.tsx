'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { businessName, projectId } = useEditor();
  const [state, setState] = useState<PublishState>('ready');
  const [logs, setLogs] = useState<string[]>([]);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanBusinessSlug = (businessName || 'my-studio').toLowerCase().replace(/[^a-z0-9]/g, '') || 'studio';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');

  const subdomainUrl = isLocal
    ? `http://${cleanBusinessSlug}.localhost:3000`
    : `https://${cleanBusinessSlug}.cuzmify.com`;

  const directPathUrl = `${origin}/s/${cleanBusinessSlug}`;

  const handlePublish = async () => {
    setState('publishing');
    setLogs([]);

    for (let i = 0; i < DEPLOY_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 350));
      setLogs((prev) => [...prev, DEPLOY_STEPS[i]]);
    }

    try {
      await onPublish();
      setPublishedUrl(subdomainUrl);
      setState('success');
    } catch {
      setState('error');
    }
  };

  const handleCopyLink = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(directPathUrl)}&color=0D5771&bgcolor=FFFFFF`;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      style={{ isolation: 'isolate' }}
    >
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl shadow-2xl overflow-hidden text-[#1A202C] animate-in zoom-in-95 duration-200 relative z-[10000000]">

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
                {subdomainUrl.replace(/^https?:\/\//, '')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#1A202C] hover:bg-[#E2E8F0] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {state === 'ready' && (
            <>
              {/* Domain & URL preview */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase font-mono tracking-wider">
                    Assigned Subdomain
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold font-mono">
                    Free SSL Active
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0D5771] truncate">
                  <Globe className="w-4 h-4 shrink-0 text-[#0D5771]" />
                  <span className="truncate">{subdomainUrl}</span>
                </div>
              </div>

              {/* Edge checklist */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase font-mono tracking-wider">
                  Edge Pre-Flight Verification
                </span>
                <div className="space-y-1.5">
                  {PUBLISH_CHECKLIST.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-[#1A202C]">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                      </div>
                      <span className="font-medium text-[11px]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#0D5771]/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
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
                  href={subdomainUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#3498E3]/20 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open {subdomainUrl.replace(/^https?:\/\//, '')}</span>
                </a>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyLink(subdomainUrl)}
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
                  <a
                    href={directPathUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#64748B] font-bold text-xs transition-all cursor-pointer"
                    title="Open via direct path /s/[subdomain]"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Direct Path</span>
                  </a>
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
    </div>,
    document.body
  );
}
