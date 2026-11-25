'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Loader2,
  Copy,
  MessageCircle,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { PRO_PRICING } from '@/lib/billing-constants';

export function DomainAndProPanel({
  siteId,
  businessName,
  onToast,
  onPlanChange,
}: {
  siteId: string;
  businessName: string;
  onToast: (msg: string) => void;
  onPlanChange?: (plan: 'free' | 'pro') => void;
}) {
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [resolvedSiteId, setResolvedSiteId] = useState<string>(siteId);
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [billingCurrency, setBillingCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showManualTransfer, setShowManualTransfer] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Domain state
  const [domainInput, setDomainInput] = useState('');
  const [connectedDomain, setConnectedDomain] = useState<string | null>(null);
  const [domainVerified, setDomainVerified] = useState(false);
  const [isConnectingDomain, setIsConnectingDomain] = useState(false);
  const [isCheckingDns, setIsCheckingDns] = useState(false);

  const founderWa = (process.env.NEXT_PUBLIC_FOUNDER_WHATSAPP || '').replace(/[^\d]/g, '');
  const founderBankInfo =
    process.env.NEXT_PUBLIC_FOUNDER_BANK_INFO ||
    'Request bank account details on WhatsApp below to receive your instant Pro Activation Code.';

  const fetchDomainAndPlan = async () => {
    setIsCheckingDns(true);
    try {
      const res = await fetch(`/api/domains?siteId=${encodeURIComponent(siteId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.plan === 'pro') {
          setPlan('pro');
          onPlanChange?.('pro');
        }
        if (data.siteId) setResolvedSiteId(data.siteId);
        if (data.customDomain) {
          setConnectedDomain(data.customDomain);
          setDomainInput(data.customDomain);
        }
        setDomainVerified(Boolean(data.verified));
      }
    } catch {
      // ignore offline
    } finally {
      setIsCheckingDns(false);
    }
  };

  useEffect(() => {
    fetchDomainAndPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const handlePaystackUpgrade = async () => {
    setErrorMsg(null);
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: resolvedSiteId,
          cycle: billingCycle,
          currency: billingCurrency,
          action: 'paystack',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not start upgrade.');
        return;
      }
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      if (data.paystackConfigured === false) {
        if (data.siteId) setResolvedSiteId(data.siteId);
        setShowManualTransfer(true);
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleActivateWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) return;
    setErrorMsg(null);
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: resolvedSiteId,
          action: 'code',
          activationCode: activationCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid activation code.');
        return;
      }
      setPlan('pro');
      onPlanChange?.('pro');
      setActivationCode('');
      onToast('🎉 Cuzmify Pro unlocked! Custom domain is now ready.');
    } catch {
      setErrorMsg('Could not verify code. Check connection.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleConnectDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    setErrorMsg(null);
    setIsConnectingDomain(true);
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: resolvedSiteId,
          customDomain: domainInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not connect domain.');
        return;
      }
      setConnectedDomain(data.customDomain);
      setDomainVerified(false);
      onToast(`✓ Added ${data.customDomain}! Point your DNS records below.`);
    } catch {
      setErrorMsg('Failed to connect domain.');
    } finally {
      setIsConnectingDomain(false);
    }
  };

  const activePrice = PRO_PRICING[billingCurrency][billingCycle];
  const waUpgradeMsg = `Hello Cuzmify! I want to upgrade "${businessName}" (Site ID: ${resolvedSiteId}) to Cuzmify Pro (${activePrice.label}). Please send transfer details / activation code.`;
  const waUpgradeHref = founderWa
    ? `https://wa.me/${founderWa}?text=${encodeURIComponent(waUpgradeMsg)}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-extrabold text-slate-900 font-display">
          Custom Domain &amp; Cuzmify Pro
        </h2>
        <p className="text-xs text-slate-500 font-mono">
          Connect your own .com or .com.ng domain with automatic SSL &amp; remove platform branding
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
          {errorMsg}
        </div>
      )}

      {/* 1. PLAN STATUS / PRO UPGRADE CARD */}
      {plan === 'pro' ? (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-emerald-950 font-display">
                Cuzmify Pro Active
              </h3>
              <p className="text-xs text-emerald-800">
                Custom domain unlocked • &ldquo;Built with Cuzmify&rdquo; badge removed • Unlimited services
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-mono font-bold">
            PRO
          </span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-mono font-bold mb-1.5">
                <Sparkles className="w-3 h-3" /> UPGRADE TO PRO
              </span>
              <h3 className="text-base font-extrabold text-slate-900 font-display">
                Look Like an Established Brand
              </h3>
              <p className="text-xs text-slate-500">
                Your site is free forever on <code className="font-mono text-[#0D5771]">/s/yourname</code>. Upgrade when you&apos;re ready for your own domain.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setBillingCurrency('NGN')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  billingCurrency === 'NGN' ? 'bg-white text-[#0D5771] shadow-2xs' : 'text-slate-500'
                }`}
              >
                NGN (₦)
              </button>
              <button
                type="button"
                onClick={() => setBillingCurrency('USD')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  billingCurrency === 'USD' ? 'bg-white text-[#0D5771] shadow-2xs' : 'text-slate-500'
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['annual', 'monthly'] as const).map((cyc) => {
              const info = PRO_PRICING[billingCurrency][cyc];
              const active = billingCycle === cyc;
              return (
                <button
                  key={cyc}
                  type="button"
                  onClick={() => setBillingCycle(cyc)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    active ? 'border-2 border-[#0D5771] bg-[#0D5771]/4' : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase font-mono text-slate-600">{cyc}</span>
                    {cyc === 'annual' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Best Value
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-extrabold text-slate-900 mt-1 font-display">{info.label}</p>
                </button>
              );
            })}
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Connect custom .com / .com.ng domain + free SSL</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Remove &ldquo;Built with Cuzmify&rdquo; badge</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited services &amp; portfolio photos</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Priority WhatsApp concierge setup help</li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              disabled={isUpgrading}
              onClick={handlePaystackUpgrade}
              className="flex-1 py-3 px-5 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              <span>Upgrade to Pro ({activePrice.label})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowManualTransfer(!showManualTransfer)}
              className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Have an Activation Code?
            </button>
          </div>

          {showManualTransfer && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900">Direct Bank Transfer / Instant Activation Code</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">{founderBankInfo}</p>
                <p className="text-[10px] font-mono text-slate-500">
                  Your Site ID: <strong className="text-slate-800">{resolvedSiteId}</strong>
                </p>
              </div>

              {waUpgradeHref && (
                <a
                  href={waUpgradeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Request Transfer &amp; Code on WhatsApp</span>
                </a>
              )}

              <form onSubmit={handleActivateWithCode} className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="PRO-XXXXXXXX"
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isUpgrading || !activationCode.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Unlock Pro
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 2. CUSTOM DOMAIN CONNECTION CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-[#0D5771]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Connect Custom Domain</h3>
              <p className="text-[11px] text-slate-500">Works with Namecheap, GoDaddy, QServers (.com.ng / .ng), Porkbun &amp; Cloudflare</p>
            </div>
          </div>
          {connectedDomain && (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                domainVerified
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {domainVerified ? '✓ SSL LIVE' : 'PENDING DNS'}
            </span>
          )}
        </div>

        <form onSubmit={handleConnectDomain} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            disabled={plan !== 'pro'}
            placeholder={plan === 'pro' ? 'e.g. toluglam.com or toluglam.com.ng' : 'Upgrade to Pro above to connect a custom domain'}
            className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#0D5771] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={plan !== 'pro' || isConnectingDomain || !domainInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {isConnectingDomain ? 'Connecting…' : connectedDomain ? 'Update Domain' : 'Connect Domain'}
          </button>
        </form>

        {connectedDomain && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                DNS Records for <span className="font-mono text-[#0D5771]">{connectedDomain}</span>
              </span>
              <button
                type="button"
                onClick={fetchDomainAndPlan}
                disabled={isCheckingDns}
                className="flex items-center gap-1 text-[11px] font-bold text-[#0D5771] hover:underline cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingDns ? 'animate-spin' : ''}`} />
                <span>{isCheckingDns ? 'Checking…' : 'Verify DNS'}</span>
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {[
                { type: 'A', host: '@', val: '76.76.21.21' },
                { type: 'CNAME', host: 'www', val: 'cname.vercel-dns.com' },
              ].map((rec) => (
                <div
                  key={rec.type}
                  className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200"
                >
                  <span>
                    <strong>{rec.type}</strong> &nbsp; Host: <strong>{rec.host}</strong> &nbsp;→&nbsp; {rec.val}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(rec.val);
                      onToast(`Copied ${rec.val}`);
                    }}
                    className="text-slate-400 hover:text-slate-800 cursor-pointer"
                    title="Copy value"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
