'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { HeroCanvasBackground } from '@/components/ui/HeroCanvasBackground';
import { HeroVisualAccents } from '@/components/ui/HeroVisualAccents';
import { NICHE_LIST } from '@/core/niche-blueprints';
import { TEMPLATE_ENGINE_LIST } from '@/core/template-engines';
import {
  Globe,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Instagram,
  Sparkles,
  MessageCircle,
  Smartphone,
  Palette,
  Layers,
  ShieldCheck,
} from 'lucide-react';

const NICHE_IMAGES: Record<string, string> = {
  beauty_makeup: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
  photography_media: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=80',
  events_planning: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
  catering_cakes: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80',
  design_fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
  general_services: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80',
};

export default function HomePage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <div className="pb-28 bg-[#FFFFFF] relative overflow-hidden text-[#0F172A]">
      {/* ═══════════════════════════════════════════════════════════════════
          1. SIGNATURE HERO SECTION — Sculpted Texture + 3D Engine Visual
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-6 sm:pt-12 pb-16 sm:pb-24 px-5 sm:px-8 overflow-hidden">
        {/* Confined Particle Mesh + Radial-Masked Dot Matrix ONLY in Hero */}
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_80%_70%_at_50%_35%,#000_30%,transparent_85%)]">
          <HeroCanvasBackground />
          <div className="absolute inset-0 bg-[radial-gradient(#0D5771_0.75px,transparent_0.75px)] [background-size:28px_28px] opacity-[0.11]" />
        </div>

        {/* Soft Ambient Brand Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[340px] bg-gradient-to-tr from-[#3498E3]/12 via-[#72B9F3]/12 to-[#0D5771]/10 blur-[110px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-12 xl:gap-10 items-center relative z-10">
          {/* Left Column: Brand Narrative & CTAs */}
          <div className="xl:col-span-7 space-y-6 text-center xl:text-left max-w-2xl mx-auto xl:mx-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-mono font-bold text-[#0D5771] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#3498E3] animate-pulse" />
              <span>BUILT FOR SERVICE BUSINESSES • LAUNCH IN 3 MINUTES</span>
            </div>

            <h1 className="text-[32px] sm:text-5xl lg:text-[56px] font-extrabold tracking-[-0.03em] font-display text-[#0F172A] leading-[1.12]">
              <span>Turn Your Instagram Into a Live Website</span>
              <span className="hero-heading block mt-1.5">
                in One Sitting.
              </span>
            </h1>

            <p className="text-[15px] sm:text-[17px] text-[#475569] leading-[1.68] max-w-xl mx-auto xl:mx-0 font-normal">
              Import your real Instagram photos and Reels, organize your service packages and rates, and publish a fast booking website—ready for WhatsApp enquiries and your own custom domain.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="pt-1 flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-3.5">
              {session?.user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#0D5771] via-[#083D50] to-[#2176AE] hover:opacity-95 text-white font-bold text-[15px] shadow-lg shadow-[#0D5771]/20 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] group"
                  >
                    <Layers className="w-4 h-4 text-sky-300" />
                    <span>Hi {firstName}! Open Dashboard</span>
                    <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/onboarding"
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-semibold text-[15px] flex items-center justify-center gap-2 transition-all"
                  >
                    <Rocket className="w-4 h-4 text-[#0D5771]" />
                    <span>Create New Site</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/onboarding"
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0D5771] to-[#2176AE] hover:opacity-95 text-white font-bold text-[15px] shadow-lg shadow-[#0D5771]/20 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] group"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Start Free From Your Phone</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <a
                    href="#templates"
                    className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#FFFFFF] hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-semibold text-[15px] flex items-center justify-center gap-2 transition-all shadow-2xs"
                  >
                    <Palette className="w-4 h-4 text-[#0D5771]" />
                    <span>Explore Styles</span>
                  </a>
                </>
              )}
            </div>

            <p className="text-[13px] text-[#64748B] font-medium">
              Free forever link • No coding required • Zero booking commission
            </p>
          </div>

          {/* Right Column: Restored 3D Transformation Engine Card */}
          <div className="xl:col-span-5 relative flex items-center justify-center xl:justify-end">
            <HeroVisualAccents />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. BUILD FROM WHAT YOU HAVE + SIGNATURE TRANSFORMATION SHOWCASE
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 sm:px-8 bg-[#F8FAFC] border-y border-[#E2E8F0]/80">
        <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#0D5771] uppercase tracking-[0.18em] font-mono">
              Build From What You Have
            </span>
            <h2 className="text-[26px] sm:text-4xl font-extrabold font-display text-[#0F172A] leading-[1.2]">
              You already have the work. Now give it a flagship home.
            </h2>
            <p className="text-[15px] sm:text-base text-[#475569] leading-[1.65]">
              Serious clients shouldn&apos;t have to scroll 200 posts or ask &ldquo;How much?&rdquo; in DMs. Cuzmify turns what you already post into a calm, structured booking experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SpotlightCard className="p-6 sm:p-7 space-y-3.5 bg-white">
              <div className="w-11 h-11 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
                <Instagram className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] font-display">Instagram Portfolio Sync</h3>
              <p className="text-[14px] sm:text-[15px] text-[#475569] leading-[1.65]">
                Import your real photos, multi-slide carousels, and Reels via official OAuth—or upload crisp shots straight from your camera roll.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 sm:p-7 space-y-3.5 bg-white">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0D5771]">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] font-display">Clear Service Packages</h3>
              <p className="text-[14px] sm:text-[15px] text-[#475569] leading-[1.65]">
                Turn any post into a bookable package in one tap—whether you charge a fixed price, a &ldquo;Starting From&rdquo; rate, or custom quotes.
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-6 sm:p-7 space-y-3.5 bg-white">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A] font-display">Structured WhatsApp Bookings</h3>
              <p className="text-[14px] sm:text-[15px] text-[#475569] leading-[1.65]">
                Clients pick a package and preferred date on your site, saving the lead to your dashboard and opening a pre-filled WhatsApp chat with you.
              </p>
            </SpotlightCard>
          </div>

          {/* Signature Visual Transformation Frame */}
          <div className="max-w-3xl mx-auto pt-2">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-[#3498E3]/15 via-[#0D5771]/10 to-[#72B9F3]/15 blur-[45px] rounded-[36px] pointer-events-none" />
              <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-[#3498E3]/70 via-[#0D5771] to-[#72B9F3]/70 shadow-[0_20px_50px_rgba(13,87,113,0.14)]">
                <div className="rounded-[22px] overflow-hidden bg-[#FFFFFF]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/cuzmify_transform.gif"
                    alt="Cuzmify transformation — from scattered social posts to a live professional website"
                    className="w-full h-auto max-h-[68vh] object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. LOSSLESS TEMPLATE SWITCHER — 3 Distinct Designer Looks
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="templates" className="py-16 sm:py-24 px-5 sm:px-8 scroll-mt-20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#0D5771] uppercase tracking-[0.18em] font-mono">
              Lossless Design Systems
            </span>
            <h2 className="text-[26px] sm:text-4xl font-extrabold font-display text-[#0F172A] leading-[1.2]">
              Three distinct looks. Switch anytime without losing work.
            </h2>
            <p className="text-[15px] sm:text-base text-[#475569] leading-[1.65]">
              Your photos, bio, and service packages stay completely intact while you change your website&apos;s typography, palette, and layout in one tap.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEMPLATE_ENGINE_LIST.map((tpl) => {
              const [bgHex, textHex, accentHex] = tpl.swatches;
              return (
                <div
                  key={tpl.id}
                  className="rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div
                      className="p-7 border-b border-black/5 space-y-4 transition-transform"
                      style={{ background: bgHex, color: textHex }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                          style={{ background: `${accentHex}24`, color: accentHex }}
                        >
                          {tpl.vibe}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {tpl.swatches.map((hex) => (
                            <span
                              key={hex}
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                              style={{ background: hex }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="pt-4 space-y-1">
                        <h3 className="text-2xl font-extrabold tracking-tight font-display">{tpl.name}</h3>
                        <p className="text-[13px] opacity-75">Mobile-first portfolio &amp; booking engine</p>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-[14px] sm:text-[15px] text-[#475569] leading-[1.65]">{tpl.tagline}</p>
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    <Link
                      href={`/onboarding?templateId=${encodeURIComponent(tpl.id)}`}
                      className="w-full py-3 px-4 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white text-[14px] font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Use {tpl.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. SERVICE VENDOR BLUEPRINTS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 px-5 sm:px-8 bg-[#F8FAFC] border-y border-[#E2E8F0]/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#0D5771] uppercase tracking-[0.18em] font-mono">
              Tailored Industry Blueprints
            </span>
            <h2 className="text-[26px] sm:text-4xl font-extrabold font-display text-[#0F172A] leading-[1.2]">
              Crafted for service vendors like you.
            </h2>
            <p className="text-[15px] sm:text-base text-[#475569] leading-[1.65]">
              Every blueprint sets up natural section headings, package layouts, and client enquiry questions tailored to your craft.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {NICHE_LIST.map((niche) => (
              <SpotlightCard key={niche.id} className="p-5 space-y-4 flex flex-col justify-between bg-white">
                <div className="space-y-3.5">
                  <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={NICHE_IMAGES[niche.id] || NICHE_IMAGES.general_services}
                      alt={niche.label}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] font-display">{niche.label}</h3>
                  <p className="text-[14px] text-[#475569] leading-[1.6]">
                    {niche.subtitle}. Ready with <strong className="text-[#0F172A] font-semibold">{niche.vocabulary.servicesHeading}</strong> &amp;{' '}
                    <strong className="text-[#0F172A] font-semibold">{niche.vocabulary.primaryCta}</strong>.
                  </p>
                </div>

                <Link
                  href={`/onboarding?nicheId=${encodeURIComponent(niche.id)}`}
                  className="w-full py-3 rounded-xl bg-[#F8FAFC] hover:bg-[#0D5771] text-[#0D5771] hover:text-white border border-[#E2E8F0] font-bold text-[14px] flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Start {niche.shortLabel} Site</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. SIMPLE, TRANSPARENT PRICING
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-16 sm:py-24 px-5 sm:px-8 scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#0D5771] uppercase tracking-[0.18em] font-mono">
              Transparent Pricing
            </span>
            <h2 className="text-[26px] sm:text-4xl font-extrabold font-display text-[#0F172A] leading-[1.2]">
              Launch free today. Upgrade when you want your own domain.
            </h2>
            <p className="text-[15px] sm:text-base text-[#475569] leading-[1.65]">
              Zero commission on your bookings—your clients pay you directly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Free Starter */}
            <div className="rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] p-7 sm:p-9 space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">Starter</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-extrabold font-display text-[#0F172A]">₦0</span>
                    <span className="text-sm text-[#64748B] font-medium">/ forever</span>
                  </div>
                  <p className="text-[14px] sm:text-[15px] text-[#475569] mt-2 leading-relaxed">
                    Everything you need to replace a crowded bio link with a professional portfolio and booking site.
                  </p>
                </div>

                <ul className="space-y-3 text-[14px] text-[#1E293B]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Instant <code className="font-mono text-[#0D5771] font-semibold">/s/yourbrand</code> shareable website link</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Official Instagram photo, carousel &amp; Reel sync</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Up to 4 service packages (Fixed, Starting From, or Quote)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>All 3 lossless design styles + WhatsApp &amp; dashboard inbox</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/onboarding"
                className="w-full py-3.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-[14px] flex items-center justify-center gap-2 transition-colors"
              >
                <span>Start Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="rounded-3xl border-2 border-[#0D5771] bg-[#071A24] text-white p-7 sm:p-9 space-y-6 flex flex-col justify-between shadow-xl">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Cuzmify Pro
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold">
                      Save 37% Yearly
                    </span>
                  </div>
                  <div className="flex items-baseline flex-wrap gap-2 mt-2">
                    <span className="text-4xl font-extrabold font-display">₦4,000</span>
                    <span className="text-sm text-slate-300 font-medium">/ mo &nbsp;or&nbsp; ₦30,000 / yr ($9/mo)</span>
                  </div>
                  <p className="text-[14px] sm:text-[15px] text-slate-300 mt-2 leading-relaxed">
                    For established studios ready for their own custom domain and unbranded client presentation.
                  </p>
                </div>

                <ul className="space-y-3 text-[14px] text-slate-100">
                  <li className="flex items-start gap-2.5">
                    <Globe className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>Connect your own <strong className="text-white">.com</strong> or <strong className="text-white">.com.ng</strong> domain + automatic SSL</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Remove the &ldquo;Built with Cuzmify&rdquo; badge</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Unlimited service packages &amp; portfolio uploads</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Easy payment via card, bank transfer, or WhatsApp concierge</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/onboarding"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#3498E3] to-[#0D5771] hover:opacity-95 text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Rocket className="w-4 h-4" />
                <span>Build Free, Upgrade Anytime</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. FINAL EXECUTIVE CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-5 sm:px-8 pt-4 pb-8">
        <div className="max-w-4xl mx-auto relative rounded-3xl bg-gradient-to-br from-[#071A24] via-[#0B2938] to-[#0D5771] text-white p-8 sm:p-14 text-center overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(#72B9F3_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-[0.12] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_20%,transparent_80%)] pointer-events-none" />
          <div className="relative z-10 space-y-5 max-w-2xl mx-auto">
            <h2 className="text-[26px] sm:text-4xl font-extrabold font-display leading-[1.18]">
              Your business already exists. Give it a pristine digital home today.
            </h2>
            <p className="text-[15px] sm:text-base text-slate-200/90 leading-relaxed">
              Connect Instagram, choose your look, and share your live booking link in minutes.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/onboarding"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-[#071A24] font-extrabold text-[15px] shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <Rocket className="w-4 h-4 text-[#0D5771]" />
                <span>Start Free Now</span>
                <ArrowRight className="w-4 h-4 text-[#0D5771]" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
