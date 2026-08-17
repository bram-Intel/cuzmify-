'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';
import { ArrowRight, Globe, ShieldCheck, Zap, ShoppingBag, Mail, Lock, Loader2 } from 'lucide-react';

interface AuthGateProps {
  wizardSummary?: {
    category?: string;
    template?: string;
    instagramHandle?: string;
  };
}

export const AuthGate: React.FC<AuthGateProps> = ({ wizardSummary }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const templateParam = encodeURIComponent(wizardSummary?.template || 'Modern Business Template');
  const categoryParam = encodeURIComponent(wizardSummary?.category || 'General');
  const targetUrl = `/editor?template=${templateParam}&category=${categoryParam}`;

  const handleInstantSignIn = async () => {
    setLoading(true);
    await signIn('credentials', {
      email: 'creator@cuzmify.local',
      name: 'Cuzmify Creator',
      callbackUrl: targetUrl,
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await signIn('credentials', {
      email: email.trim(),
      name: email.split('@')[0],
      callbackUrl: targetUrl,
    });
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: targetUrl });
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 py-8">
      <div className="w-full max-w-md space-y-6 text-center bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">

        {/* Logo + Brand */}
        <div className="flex flex-col items-center gap-2">
          <CuzmifyLogo className="w-12 h-12" />
          <div>
            <h1 className="text-xl font-black text-[#1A202C] font-display tracking-tight">
              Save Your Project &amp; Launch
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Sign in to save your design to the cloud database and enter Visual Studio.
            </p>
          </div>
        </div>

        {/* What we built summary */}
        {(wizardSummary?.category || wizardSummary?.template) && (
          <div className="bg-[#F7FAFC] rounded-2xl border border-[#E2E8F0] p-3.5 text-left space-y-2">
            <p className="text-[10px] font-mono font-bold text-[#0D5771] uppercase tracking-widest">
              Ready to Customize
            </p>
            {wizardSummary.category && (
              <div className="flex items-center gap-2 text-xs text-[#1A202C]">
                <Zap className="w-3.5 h-3.5 text-[#3498E3] flex-shrink-0" />
                <span>Category: <strong>{wizardSummary.category}</strong></span>
              </div>
            )}
            {wizardSummary.template && (
              <div className="flex items-center justify-between text-xs text-[#1A202C] pt-1 border-t border-[#E2E8F0]/70">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#0D5771] flex-shrink-0" />
                  <span>Template: <strong>{wizardSummary.template}</strong></span>
                </div>
              </div>
            )}
            {wizardSummary.instagramHandle && (
              <div className="flex items-center gap-2 text-xs text-[#1A202C] pt-1 border-t border-[#E2E8F0]/70">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Connected: <strong>@{wizardSummary.instagramHandle}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* 1-Click Fast Sign In */}
        <button
          onClick={handleInstantSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-[#0D5771]/20 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Zap className="w-4 h-4 text-[#FCD34D]" />
          )}
          <span>1-Click Instant Sign In &amp; Launch</span>
          <ArrowRight className="w-3.5 h-3.5 text-white ml-auto" />
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E2E8F0]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">Or with Email</span>
          <div className="flex-1 h-px bg-[#E2E8F0]" />
        </div>

        {/* Email Sign In */}
        <form onSubmit={handleEmailSignIn} className="space-y-2.5">
          <div className="relative">
            <input
              type="email"
              id="authgate-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email to sign in"
              required
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0D5771] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs text-[#1A202C] outline-none transition-all pl-9"
            />
            <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#1A202C] font-bold text-xs shadow-none transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5 text-[#0D5771]" />}
            <span>Sign In with Email</span>
          </button>
        </form>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#0D5771]/30 transition-all font-semibold text-xs text-[#1A202C]"
        >
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 pt-2 text-[10px] text-[#94A3B8] font-mono">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Auto-Save Active
          </span>
          <span>•</span>
          <span>Zero Password Required</span>
        </div>
      </div>
    </div>
  );
};
