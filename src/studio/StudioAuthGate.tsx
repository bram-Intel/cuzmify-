'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { CuzmifyLogo } from '@/components/ui/CuzmifyLogo';
import { HeroCanvasBackground } from '@/components/ui/HeroCanvasBackground';
import { ArrowRight, Lock, Zap, ShieldCheck, Mail, Loader2 } from 'lucide-react';

export function StudioAuthGate({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setLoading(true);
    signIn('google', { callbackUrl });
  };

  const handleInstantSignIn = async () => {
    setLoading(true);
    await signIn('credentials', {
      email: 'creator@cuzmify.local',
      name: 'Cuzmify Creator',
      callbackUrl,
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await signIn('credentials', {
      email: email.trim(),
      name: email.split('@')[0],
      callbackUrl,
    });
  };

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] text-[#1A202C] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background mesh */}
      <HeroCanvasBackground />

      <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl border border-[#E2E8F0] shadow-[0_20px_60px_rgba(13,87,113,0.1)] p-6 sm:p-8 space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <CuzmifyLogo className="w-12 h-12" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D5771]/10 text-[#0D5771] text-[10px] font-mono font-extrabold uppercase tracking-wider border border-[#0D5771]/20">
            <Lock className="w-3 h-3 text-[#0D5771]" /> Authentication Required
          </div>
          <h1 className="text-xl font-black text-[#1A202C] font-display">
            Sign In to Cuzmify Visual Studio
          </h1>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Please authenticate to load your saved websites, database models, and autonomous AI builder.
          </p>
        </div>

        {/* PRIMARY: Continue with Google (Account Chooser) */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white border border-[#CBD5E1] shadow-sm hover:shadow-md hover:border-[#0D5771]/40 transition-all font-bold text-sm text-[#1A202C] group cursor-pointer disabled:opacity-50"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
          <ArrowRight className="w-4 h-4 text-[#0D5771] ml-auto group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#E2E8F0]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#94A3B8]">Or with Email</span>
          <div className="flex-1 h-px bg-[#E2E8F0]" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSignIn} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider block">Account Email</label>
            <div className="relative">
              <input
                type="email"
                id="gate-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0D5771] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#1A202C] outline-none transition-all pl-9"
              />
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Sign In with Email</span>
          </button>
        </form>

        {/* 1-Click Fast Developer Login */}
        <div className="pt-1">
          <button
            onClick={handleInstantSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-[#64748B] hover:text-[#1A202C] font-semibold text-[11px] transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-[#0D5771]" />
            <span>1-Click Fast Developer Login</span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 text-center border-t border-[#E2E8F0] space-y-2">
          <p className="text-xs text-[#64748B]">
            Need a new custom website?{' '}
            <Link href="/onboarding" className="text-[#0D5771] font-bold hover:underline">
              Start Onboarding →
            </Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-[#94A3B8] font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Encrypted Session • Cloud Persistence Active</span>
          </div>
        </div>

      </div>
    </div>
  );
}
