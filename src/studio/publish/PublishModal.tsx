'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Rocket,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  Globe,
  Loader2,
  Smartphone,
} from 'lucide-react';
import { useEditor } from '../engine/EditorContext';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';

interface PublishModalProps {
  onClose: () => void;
  onPublish: () => Promise<string>;
}

type PublishState = 'ready' | 'publishing' | 'success' | 'error';

export function PublishModal({ onClose, onPublish }: PublishModalProps) {
  const { businessName } = useEditor();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<PublishState>('ready');
  const [publishedUrl, setPublishedUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cleanBusinessSlug =
    (businessName || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) || 'studio';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cuzmify.vercel.app';
  const rootWildcard = process.env.NEXT_PUBLIC_ROOT_DOMAIN; // e.g. 'cuzmify.com' once domain is purchased

  const primaryLiveUrl = rootWildcard
    ? `https://${cleanBusinessSlug}.${rootWildcard}`
    : `${origin}/s/${cleanBusinessSlug}`;

  const handlePublish = async () => {
    setState('publishing');
    try {
      const returnedPath = await onPublish();
      const finalUrl = rootWildcard
        ? primaryLiveUrl
        : returnedPath?.startsWith('http')
          ? returnedPath
          : `${origin}${returnedPath || `/s/${cleanBusinessSlug}`}`;
      setPublishedUrl(finalUrl);
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

  const activeShareUrl = publishedUrl || primaryLiveUrl;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(activeShareUrl)}&color=0D5771&bgcolor=FFFFFF`;

  if (!mounted) return null;

  return createPortal(
    <div
      data-cuzmify-studio-modal="true"
      className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
      style={{ isolation: 'isolate' }}
    >
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-3xl shadow-2xl overflow-hidden text-[#1A202C] relative z-[10000000]">
        <div className="px-5 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <CuzmifyLogo className="w-9 h-9 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#1A202C] font-display">
                {state === 'success'
                  ? '🎉 Your Website is Live!'
                  : state === 'publishing'
                    ? 'Publishing Your Site…'
                    : 'Publish Your Website'}
              </h2>
              <p className="text-[11px] text-[#64748B] font-mono truncate">
                {activeShareUrl.replace(/^https?:\/\//, '')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#1A202C] hover:bg-[#E2E8F0] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {state === 'ready' && (
            <>
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase font-mono">
                    Shareable Bio Link
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold font-mono">
                    HTTPS Active
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0D5771] break-all">
                  <Globe className="w-4 h-4 shrink-0 text-[#0D5771]" />
                  <span>{primaryLiveUrl}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#475569]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Saves your latest portfolio photos, rates &amp; look</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Enables live client enquiries &amp; WhatsApp booking</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Publish Now</span>
                </button>
              </div>
            </>
          )}

          {state === 'publishing' && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-[#0D5771] animate-spin" />
              <p className="text-xs font-bold text-[#1A202C]">Saving &amp; publishing your live website…</p>
            </div>
          )}

          {state === 'success' && (
            <div className="space-y-4 text-center animate-in fade-in duration-150">
              <p className="text-xs text-[#64748B]">
                Paste this link into your <strong>Instagram Bio</strong> or share it directly on WhatsApp:
              </p>

              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] flex flex-col items-center gap-2">
                <img
                  src={qrCodeUrl}
                  alt="Website QR Code"
                  className="w-28 h-28 rounded-lg bg-white p-1.5 border border-[#E2E8F0]"
                />
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#0D5771]">
                  <Smartphone className="w-3 h-3" /> Scan or copy bio link below
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleCopyLink(activeShareUrl)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied for Instagram Bio!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Link for Instagram Bio</span>
                    </>
                  )}
                </button>

                <a
                  href={activeShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#1A202C] font-bold text-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#0D5771]" />
                  <span>Open Live Site</span>
                </a>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-3 text-center">
              <p className="text-sm font-bold text-red-600">Could not publish right now</p>
              <p className="text-xs text-[#64748B]">Please check your internet connection and try again.</p>
              <button
                onClick={() => setState('ready')}
                className="w-full py-2.5 rounded-xl bg-[#0D5771] text-white font-bold text-xs cursor-pointer"
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
