'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';
import { ArrowRight, Mail, Lock, Loader2 } from 'lucide-react';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/core/blueprint-schema';

export interface WizardSummaryData {
  businessName?: string;
  category?: string;
  currency?: CurrencyCode;
  whatsapp?: string;
  instagramHandle?: string;
  template?: string;
}

interface AuthGateProps {
  wizardSummary?: WizardSummaryData;
}

export const AuthGate: React.FC<AuthGateProps> = ({ wizardSummary }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const businessName = wizardSummary?.businessName || 'My Business';
  const category = wizardSummary?.category || 'Service Business';
  const currency = wizardSummary?.currency || 'NGN';
  const template = wizardSummary?.template || 'Editorial Atelier';
  const whatsapp = wizardSummary?.whatsapp || '';
  const instagram = wizardSummary?.instagramHandle || '';

  const queryParams = new URLSearchParams({
    name: businessName,
    category,
    currency,
    template,
    ...(whatsapp ? { whatsapp } : {}),
    ...(instagram ? { instagram } : {}),
  });

  const targetUrl = `/studio?${queryParams.toString()}`;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) return;
    setLoading(true);
    await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      name: businessName || email.split('@')[0],
      callbackUrl: targetUrl,
    });
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    signIn('google', { callbackUrl: targetUrl });
  };

  const currSymbol = SUPPORTED_CURRENCIES[currency as CurrencyCode]?.symbol || '₦';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-4">
      <div className="w-full max-w-md space-y-5 text-center bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
        <div className="flex flex-col items-center gap-2">
          <CuzmifyLogo className="w-11 h-11" />
          <div>
            <h1 className="text-xl font-black text-[#1A202C] font-display tracking-tight">
              Save &amp; Open Your Site
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Create your account or sign in so only you can edit and publish your site.
            </p>
          </div>
        </div>

        <div className="bg-[#F7FAFC] rounded-2xl border border-[#E2E8F0] p-4 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#0D5771] uppercase tracking-widest">
              Your Setup
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0D5771]/10 text-[#0D5771]">
              Ready
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#1A202C]">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Business:</span>
              <strong className="text-[#0D5771]">{businessName}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Niche:</span>
              <strong>{category}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Currency:</span>
              <span className="font-mono font-bold text-emerald-700">{currSymbol} {currency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Template:</span>
              <strong className="text-[#1A202C] truncate max-w-[180px]">{template}</strong>
            </div>
            {instagram && (
              <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0]/70">
                <span className="text-[#64748B]">Instagram:</span>
                <span className="text-pink-600 font-semibold">@{instagram}</span>
              </div>
            )}
            {whatsapp && (
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">WhatsApp:</span>
                <span className="text-emerald-600 font-semibold">{whatsapp}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-[#0D5771] hover:bg-[#083D50] text-white transition-all font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4 flex-shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E2E8F0]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">Or Email &amp; Password</span>
          <div className="flex-1 h-px bg-[#E2E8F0]" />
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-2.5">
          <div className="relative">
            <input
              type="email"
              id="authgate-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0D5771] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#1A202C] outline-none transition-all pl-9"
            />
            <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
          </div>
          <div className="relative">
            <input
              type="password"
              id="authgate-password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min 6 chars)"
              minLength={6}
              required
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0D5771] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#1A202C] outline-none transition-all pl-9"
            />
            <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim() || password.length < 6}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#1A202C] font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5 text-[#0D5771]" />}
            <span>Save &amp; Continue with Email</span>
          </button>
        </form>

        <p className="text-[11px] text-[#94A3B8]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0D5771] font-bold underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
