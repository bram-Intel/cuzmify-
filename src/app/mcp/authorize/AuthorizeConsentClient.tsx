'use client';

import React, { useState } from 'react';
import { ShieldCheck, Check, X, Globe, Sparkles, Loader2 } from 'lucide-react';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';

interface AuthorizeConsentClientProps {
  clientName: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  scope: string;
  resource?: string;
  userEmail: string;
  userName?: string | null;
  siteCount: number;
}

export function AuthorizeConsentClient(props: AuthorizeConsentClientProps) {
  const [submitting, setSubmitting] = useState<'approve' | 'deny' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecision = async (decision: 'approve' | 'deny') => {
    setSubmitting(decision);
    setError(null);
    try {
      const res = await fetch('/api/mcp/oauth/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          clientId: props.clientId,
          redirectUri: props.redirectUri,
          codeChallenge: props.codeChallenge,
          state: props.state,
          scope: props.scope,
          resource: props.resource,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.redirectTo) {
        setError(data?.error || 'Could not complete authorization.');
        setSubmitting(null);
        return;
      }
      window.location.href = data.redirectTo;
    } catch {
      setError('Network error while authorizing.');
      setSubmitting(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-3xl shadow-[0_20px_60px_rgba(13,87,113,0.1)] p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-3">
            <CuzmifyLogo className="w-11 h-11" />
            <span className="text-slate-300 font-bold">⇄</span>
            <div className="w-11 h-11 rounded-2xl bg-[#0D5771]/10 border border-[#0D5771]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#0D5771]" />
            </div>
          </div>
          <h1 className="text-xl font-black text-[#0F172A] font-display">
            Connect {props.clientName} to Cuzmify
          </h1>
          <p className="text-xs text-[#64748B]">
            Signed in as <strong className="text-[#0F172A]">{props.userName || props.userEmail}</strong> ({props.siteCount}{' '}
            {props.siteCount === 1 ? 'website' : 'websites'})
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5 text-xs text-[#334155]">
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0D5771]">
            {props.clientName} will be able to:
          </p>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Read your website blueprint, services, media vault &amp; client enquiries</span>
          </div>
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Update copy, layout styles, service packages, FAQs &amp; SEO metadata</span>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="w-4 h-4 text-[#0D5771] shrink-0 mt-0.5" />
            <span>Publish or unpublish your Cuzmify websites on your behalf</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => handleDecision('deny')}
            className="flex-1 py-3 px-4 rounded-2xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            type="button"
            disabled={submitting !== null}
            onClick={() => handleDecision('approve')}
            className="flex-[1.5] py-3 px-4 rounded-2xl bg-[#0D5771] hover:bg-[#083D50] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {submitting === 'approve' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            )}
            <span>{submitting === 'approve' ? 'Connecting…' : 'Approve & Connect'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
