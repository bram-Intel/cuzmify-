'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
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
    <div className="space-y-20 pb-28 bg-[#FFFFFF] relative overflow-hidden text-[#1A202C]">
      {/* Subtle Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#0D5771_0.65px,transparent_0.65px)] [background-size:28px_28px] opacity-8 pointer-events-none" />

      {/* 1. HERO SECTION */}
      <section className="relative px-5 sm:px-6 pt-6 sm:pt-10 pb-4 max-w-6xl mx-auto z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[280px] bg-gradient-to-tr from-[#3498E3]/12 via-[#72B9F3]/12 to-[#0D5771]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center space-y-5 relative z-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[10px] sm:text-[11px] font-mono font-bold text-[#0D5771] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>BUILT FOR SERVICE VENDORS • MOBILE-FIRST • READY IN 3 MINUTES</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-[#1A202C] leading-[1.14]">
            Turn Your Instagram Into a Professional{' '}
            <span className="text-[#0D5771]">Portfolio &amp; Booking Website</span>
          </h1>

          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            Cuzmify imports your real Instagram posts, organizes your service packages and rates, and publishes a fast mobile booking link that sends structured client enquiries straight to your WhatsApp and inbox.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-sm shadow-md shadow-[#3498E3]/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Layers className="w-4 h-4" />
                  <span>Hi {firstName}! Open My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/onboarding"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#1A202C] font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Rocket className="w-4 h-4 text-[#0D5771]" />
                  <span>Create Another Site</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/onboarding"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-sm shadow-md shadow-[#3498E3]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Build Free From Your Phone</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#templates"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#1A202C] font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Palette className="w-4 h-4 text-[#0D5771]" />
                  <span>See Website Styles</span>
                </a>
              </>
            )}
          </div>

          <p className="text-xs text-[#64748B] font-medium">
            Free forever bio link • Zero coding • Uses your real photos &amp; rates (never fake placeholder prices)
          </p>
        </div>
      </section>

      {/* 2. HOW IT WORKS IN 3 PHONE STEPS */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
            3 Minutes on Your Phone
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
            Stop losing serious clients in messy DMs.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto">
            Clients want to see your best work, clear package options, and an easy way to book—without scrolling 200 posts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SpotlightCard className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
                <Instagram className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-[#0D5771]">STEP 01</span>
            </div>
            <h3 className="text-base font-bold text-[#1A202C] font-display">Connect Instagram or Upload</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Import your real Instagram photos, carousels, and Reels via official OAuth—or upload compressed WebP shots straight from your phone gallery.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0D5771]">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-[#0D5771]">STEP 02</span>
            </div>
            <h3 className="text-base font-bold text-[#1A202C] font-display">Turn Posts Into Packages &amp; Switch Styles</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Convert any post into a service package (Fixed Price, Starting From, or Custom Quote) and switch between 3 designer layouts anytime without losing work.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold text-[#0D5771]">STEP 03</span>
            </div>
            <h3 className="text-base font-bold text-[#1A202C] font-display">Publish &amp; Receive Structured Bookings</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Put your live Cuzmify link (or custom .com / .com.ng domain) in your IG bio. Visitors pick a package, pick a date, and enquire straight to your WhatsApp &amp; dashboard inbox.
            </p>
          </SpotlightCard>
        </div>
      </section>

      {/* 3. THREE LOSSLESS TEMPLATE ENGINES */}
      <section id="templates" className="max-w-6xl mx-auto px-5 sm:px-6 space-y-8 scroll-mt-24">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
            Lossless Template Switcher
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
            Three distinct looks. Zero lost content when you switch.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto">
            Your photos, bio, and service packages stay intact while you switch typography, layout, and mood in one tap—plus full desktop visual editing when you want pixel control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TEMPLATE_ENGINE_LIST.map((tpl) => {
            const [bgHex, textHex, accentHex] = tpl.swatches;
            return (
              <div
                key={tpl.id}
                className="rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Visual Mood Swatch Header */}
                  <div
                    className="p-6 border-b border-black/5 space-y-3"
                    style={{ background: bgHex, color: textHex }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                        style={{ background: `${accentHex}22`, color: accentHex }}
                      >
                        {tpl.vibe}
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/40"
                        style={{ background: accentHex }}
                      />
                    </div>
                    <div className="pt-3 space-y-1">
                      <p className="text-xl font-extrabold tracking-tight">{tpl.name}</p>
                      <p className="text-xs opacity-75">Live responsive portfolio + enquiry modal</p>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <p className="text-xs text-[#64748B] leading-relaxed">{tpl.tagline}</p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <Link
                    href={`/onboarding?templateId=${encodeURIComponent(tpl.id)}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Start With {tpl.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SERVICE VENDOR BLUEPRINTS */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
            Service Vendor Blueprints
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
            Tailored for the way service vendors actually work.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Choose your niche for tailored section headings, booking CTAs, and WhatsApp enquiry prompts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {NICHE_LIST.map((niche) => (
            <SpotlightCard key={niche.id} className="p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={NICHE_IMAGES[niche.id] || NICHE_IMAGES.general_services}
                    alt={niche.label}
                    loading="lazy"
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <h3 className="text-base font-bold text-[#1A202C] font-display">{niche.label}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {niche.subtitle}. Includes <strong className="text-[#1A202C]">{niche.vocabulary.portfolioHeading}</strong>,{' '}
                  <strong className="text-[#1A202C]">{niche.vocabulary.servicesHeading}</strong>, and{' '}
                  <strong className="text-[#1A202C]">{niche.vocabulary.primaryCta}</strong> flow.
                </p>
              </div>

              <Link
                href={`/onboarding?nicheId=${encodeURIComponent(niche.id)}`}
                className="w-full py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#0D5771] text-[#0D5771] hover:text-white border border-[#E2E8F0] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Build {niche.shortLabel} Site</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* 5. HONEST, SIMPLE PRICING */}
      <section id="pricing" className="max-w-5xl mx-auto px-5 sm:px-6 space-y-8 scroll-mt-24">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
            Simple Pricing
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
            Launch free today. Upgrade when you want your own domain.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Zero commission on your bookings. Clients pay you directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <div className="rounded-3xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 sm:p-8 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#64748B]">Starter</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold font-display text-[#1A202C]">₦0</span>
                  <span className="text-xs text-[#64748B]">/ forever</span>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Everything you need to replace a messy Instagram bio with a live booking site.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-[#1A202C]">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Instant <code className="font-mono text-[#0D5771]">/s/yourbrand</code> bio link</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Official Instagram photo, carousel &amp; Reel import</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Up to 4 service packages (Fixed, From, or Custom Quote)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> All 3 lossless website templates + enquiry inbox</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Direct WhatsApp booking handoff</li>
              </ul>
            </div>

            <Link
              href="/onboarding"
              className="w-full py-3 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1A202C] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Start Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="rounded-3xl border-2 border-[#0D5771] bg-[#071A24] text-white p-6 sm:p-8 space-y-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Cuzmify Pro
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                    Save 37% Yearly
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold font-display">₦4,000</span>
                  <span className="text-xs text-slate-300">/ mo &nbsp;or&nbsp; ₦30,000 / yr ($9/mo)</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  For established vendors ready for their own custom domain and unbranded client experience.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-100">
                <li className="flex items-center gap-2"><Globe className="w-4 h-4 text-sky-400 shrink-0" /> Connect your own <strong className="text-white">.com</strong> or <strong className="text-white">.com.ng</strong> domain + automatic SSL</li>
                <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Remove the &ldquo;Built with Cuzmify&rdquo; badge</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited service packages &amp; portfolio uploads</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Pay via card, bank transfer, or WhatsApp concierge</li>
              </ul>
            </div>

            <Link
              href="/onboarding"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#3498E3] to-[#0D5771] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Build Free, Upgrade Anytime</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 text-center space-y-5 pt-2">
        <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-[#1A202C]">
          Ready to turn your Instagram into a real booking website?
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/onboarding"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-sm shadow-md shadow-[#3498E3]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Rocket className="w-4 h-4" />
            <span>Create Your Site in 3 Minutes</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
