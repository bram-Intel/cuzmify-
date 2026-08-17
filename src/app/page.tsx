'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { HeroCanvasBackground } from '@/components/ui/HeroCanvasBackground';
import { HeroVisualAccents } from '@/components/ui/HeroVisualAccents';
import { RevampUrlForm } from '@/components/importer/RevampUrlForm';
import {
  Globe,
  Rocket,
  ShoppingBag,
  CheckCircle2,
  Box,
  Cpu,
  ArrowRight,
  Workflow,
  Zap,
  CreditCard,
  Truck,
  Calendar,
  Users,
  Plus,
  Check,
  Instagram,
  Sparkles,
  Sliders,
  MessageCircle,
} from 'lucide-react';

interface IndustryCard {
  id: string;
  name: string;
  subtitle: string;
  modules: string[];
  imageUrl: string;
}

const INDUSTRIES: IndustryCard[] = [
  {
    id: 'makeup',
    name: 'Makeup Artists',
    subtitle: 'Showcase bridal portfolios and accept WhatsApp appointments directly.',
    modules: ['Booking', 'WhatsApp', 'Catalog'],
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'fashion',
    name: 'Fashion Sellers',
    subtitle: 'Display your clothing collections with automated size picks and cart checkout.',
    modules: ['Catalog', 'Shopping Cart', 'Payments', 'Delivery'],
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'events',
    name: 'Event Planners',
    subtitle: 'Present event packages, collect booking deposits, and manage clients.',
    modules: ['Booking', 'CRM', 'Payments'],
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'photo',
    name: 'Photographers',
    subtitle: 'High-resolution photo galleries with client proofing and session reservations.',
    modules: ['Booking', 'Catalog'],
    imageUrl: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'caterers',
    name: 'Caterers & Chefs',
    subtitle: 'Interactive food menus, tasting schedules, and custom catering quotes.',
    modules: ['Catalog', 'Booking', 'Payments'],
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'interior',
    name: 'Interior Designers',
    subtitle: 'Design portfolio showcase, consultation calendar, and project estimates.',
    modules: ['Catalog', 'Booking', 'CRM'],
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80',
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [activeModules, setActiveModules] = useState<string[]>(['Catalog', 'Booking']);

  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  const toggleModule = (id: string) => {
    if (activeModules.includes(id)) {
      setActiveModules(activeModules.filter((m) => m !== id));
    } else {
      setActiveModules([...activeModules, id]);
    }
  };

  return (
    <div className="space-y-16 pb-28 bg-[#FFFFFF] relative overflow-hidden text-[#1A202C]">
      {/* Background Particle Mesh Canvas */}
      <HeroCanvasBackground />

      {/* Radial Dot Grid Background Mask */}
      <div className="absolute inset-0 bg-[radial-gradient(#0D5771_0.65px,transparent_0.65px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      {/* 1. HERO SECTION */}
      <section className="relative px-6 pt-4 sm:pt-6 pb-6 max-w-7xl mx-auto relative z-10">
        {/* Soft Ambient Glow Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-[#3498E3]/12 via-[#72B9F3]/15 to-[#0D5771]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="xl:col-span-7 space-y-4 text-center xl:text-left max-w-2xl mx-auto xl:mx-0 relative z-20">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[10px] font-mono font-bold text-[#0D5771] shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3498E3] animate-pulse" />
              <span>NO CODE • NO CONFUSING SETUP • LAUNCH IN MINUTES</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display text-[#1A202C] leading-[1.18]">
              <span>Turn Your Business Into a Live Website</span>
              <span className="hero-heading block mt-1">
                in One Sitting.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xs sm:text-sm md:text-base text-[#64748B] leading-relaxed max-w-xl mx-auto xl:mx-0">
              Turn your Instagram, WhatsApp, or existing website into a professional website that's ready for your own domain, secure hosting, and future growth.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-3">
              {session?.user ? (
                <Link
                  href="/editor"
                  className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-[#0D5771] via-[#083D50] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#3498E3]/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] border border-white/20 group"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Hi {firstName}! Open Visual Studio</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  href="/onboarding"
                  className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#3498E3]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Start Free</span>
                </Link>
              )}

              <Link
                href="/importer"
                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-[#F7FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#1A202C] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Globe className="w-4 h-4 text-[#0D5771]" />
                <span>Revamp My Website</span>
              </Link>
            </div>

            {/* Trust Statement */}
            <p className="text-[11px] text-[#64748B] font-medium pt-0.5">
              No coding required • Instant AI setup • Launch in minutes
            </p>
          </div>

          {/* Right Column: 3D Transformation Engine Card */}
          <div className="xl:col-span-5 relative flex items-center justify-center xl:justify-end">
            <HeroVisualAccents />
          </div>
        </div>
      </section>

      {/* 2. BUILD FROM WHAT YOU HAVE (NOW COMES FIRST BEFORE TRANSFORMATION) */}
      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
            Build From What You Have
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
            You already have a business. You just don't have a digital home.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Instead of starting from scratch, Cuzmify builds from what you already have.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SpotlightCard className="p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600">
              <Instagram className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1A202C] font-display">📷 Instagram Portfolio</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Turn your existing photos and client showcases into a clean, professional web gallery.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1A202C] font-display">💬 WhatsApp Business</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Keep selling through WhatsApp while upgrading your online presentation and service menu.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0D5771]">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1A202C] font-display">🌐 Existing Website</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Bring your current website into Cuzmify and rebuild it using a modern design system.
            </p>
          </SpotlightCard>
        </div>
      </section>

      {/* 3. SIGNATURE MOMENT: THE CUZMIFY TRANSFORMATION */}
      <section className="max-w-3xl mx-auto px-6">
        <div className="relative">
          {/* Ambient glow behind */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#3498E3]/20 via-[#0D5771]/10 to-[#72B9F3]/20 blur-[50px] rounded-[40px] pointer-events-none" />

          {/* Gradient border ring */}
          <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-[#3498E3] via-[#0D5771] to-[#72B9F3] shadow-[0_16px_48px_rgba(13,87,113,0.16)]">
            <div className="rounded-[14px] overflow-hidden bg-[#F7FAFC]">
              <img
                src="/cuzmify_transform.gif"
                alt="Cuzmify transformation — from scattered social links to a live professional website"
                className="w-full h-auto max-h-[70vh] object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. WEBSITE REVAMP SECTION */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="bg-[#F7FAFC] p-6 md:p-10 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
              Website Revamp Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1A202C]">
              Already have a website? Let's rebuild it.
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto">
              Paste your website. Cuzmify analyzes its structure, keeps what matters, and rebuilds it using a modern design system.
            </p>
          </div>

          <RevampUrlForm />

          <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
            <span className="text-[11px] font-bold text-[#1A202C] uppercase tracking-wider block text-center">
              You'll receive an instant breakdown of:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E2E8F0] text-center font-semibold text-[#0D5771]">
                Website Health Report
              </div>
              <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E2E8F0] text-center font-semibold text-[#0D5771]">
                Mobile Experience Check
              </div>
              <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E2E8F0] text-center font-semibold text-[#0D5771]">
                Modernization Preview
              </div>
              <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E2E8F0] text-center font-semibold text-[#0D5771]">
                SEO & Speed Overview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
            Simple 5-Step Path
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
            From business to live website.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {[
            { step: '1', title: 'Choose', desc: 'Pick a website built for your business.' },
            { step: '2', title: 'Import', desc: 'Bring your business information or website.' },
            { step: '3', title: 'Cuzmify', desc: 'Customize it using AI or simple visual controls.' },
            { step: '4', title: 'Launch', desc: 'Connect a domain and go live.' },
            { step: '5', title: 'Grow', desc: 'Add new capabilities whenever your business grows.' },
          ].map((s) => (
            <SpotlightCard key={s.step} className="p-4 space-y-2 text-center flex flex-col justify-between">
              <div className="w-7 h-7 rounded-full bg-[#0D5771] text-white font-mono font-bold text-xs flex items-center justify-center mx-auto">
                {s.step}
              </div>
              <h3 className="font-bold text-sm text-[#1A202C] font-display">{s.title}</h3>
              <p className="text-[11px] text-[#64748B] leading-relaxed">{s.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* 6. AI SECTION */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="bg-[#F7FAFC] p-6 md:p-10 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
              AI Business Customization
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
              Tell Cuzmify what you want. Don't edit code.
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
              Just describe your business in plain English.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E2E8F0] shadow-sm max-w-xl mx-auto space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase text-[#0D5771]">Example Prompt</span>
            <p className="text-xs sm:text-sm font-semibold text-[#1A202C]">
              "Make my website feel luxurious and make bridal makeup the main service."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E2E8F0] space-y-2">
              <span className="text-[10px] font-bold text-[#64748B] uppercase font-mono">BEFORE</span>
              <h4 className="font-bold text-sm text-[#1A202C]">Standard Beauty Website</h4>
              <p className="text-xs text-[#64748B]">Generic layout with basic service list and default colors.</p>
            </div>

            <div className="bg-[#071A24] p-5 rounded-2xl border border-[#1E3A4A] text-white space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">AFTER (AI CUSTOMIZED)</span>
              <h4 className="font-bold text-sm text-amber-300">Luxury Theme & Bridal Focal Point</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>✓ Luxury deep obsidian & gold accents</li>
                <li>✓ Bridal-focused homepage banner</li>
                <li>✓ Premium typography scale</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-1">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#0D5771]/10 text-[#0D5771] font-mono text-xs font-bold">
              AI changes your business—not your code.
            </span>
          </div>
        </div>
      </section>

      {/* 7. INDUSTRY SECTION */}
      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
            Tailored Industry Blueprints
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
            Built for businesses like yours.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            See your ready-made starting point.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INDUSTRIES.map((ind) => (
            <SpotlightCard key={ind.id} className="p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#F1F5F9]">
                  <img
                    src={ind.imageUrl}
                    alt={ind.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <h3 className="text-base font-bold text-[#1A202C] font-display">{ind.name}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{ind.subtitle}</p>
              </div>

              <Link
                href={`/onboarding?category=${encodeURIComponent(ind.name)}`}
                className="w-full py-2.5 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Preview This Starter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* 8. COMPOSABLE SECTION */}
      <section className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="bg-[#F7FAFC] p-6 md:p-10 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
              Modular Growth
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
              Your website grows with your business.
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
              Start simple. Add only what you need.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'Catalog', name: 'Catalog', icon: Box },
              { id: 'Shopping Cart', name: 'Shopping Cart', icon: ShoppingBag },
              { id: 'Orders', name: 'Orders', icon: Workflow },
              { id: 'Payments', name: 'Payments', icon: CreditCard },
              { id: 'Delivery', name: 'Delivery', icon: Truck },
              { id: 'Booking', name: 'Booking', icon: Calendar },
              { id: 'CRM', name: 'CRM', icon: Users },
              { id: 'Analytics', name: 'Analytics', icon: Cpu },
            ].map((mod) => {
              const IconComp = mod.icon;
              const isAttached = activeModules.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 ${
                    isAttached
                      ? 'bg-[#FFFFFF] border-[#0D5771] shadow-sm'
                      : 'bg-[#FFFFFF]/60 border-[#E2E8F0] text-[#64748B] hover:border-slate-300'
                  }`}
                  suppressHydrationWarning
                >
                  <div className="flex items-center justify-between">
                    <IconComp className={`w-4 h-4 ${isAttached ? 'text-[#0D5771]' : 'text-slate-400'}`} />
                    {isAttached ? <Check className="w-3.5 h-3.5 text-[#0D5771] stroke-[3]" /> : <Plus className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <span className="text-xs font-bold text-[#1A202C] font-display">{mod.name}</span>
                </button>
              );
            })}
          </div>

          <div className="text-center pt-1">
            <p className="text-xs text-[#0D5771] font-semibold">
              You don't rebuild your website. You simply attach new capabilities.
            </p>
          </div>
        </div>
      </section>

      {/* 9. DEPLOYMENT SECTION */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="bg-[#F7FAFC] p-6 md:p-10 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-5">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-[#0D5771] uppercase tracking-widest font-mono">
              Simple Deployment
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1A202C]">
              One click from ready to live.
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Cuzmify handles the heavy technical work behind the scenes:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold text-[#1A202C]">
            <div className="flex items-center gap-2 bg-[#FFFFFF] p-3 rounded-xl border border-[#E2E8F0]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Connect your custom domain</span>
            </div>
            <div className="flex items-center gap-2 bg-[#FFFFFF] p-3 rounded-xl border border-[#E2E8F0]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Verify DNS automatically</span>
            </div>
            <div className="flex items-center gap-2 bg-[#FFFFFF] p-3 rounded-xl border border-[#E2E8F0]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Enable secure HTTPS / SSL</span>
            </div>
            <div className="flex items-center gap-2 bg-[#FFFFFF] p-3 rounded-xl border border-[#E2E8F0]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Deploy and troubleshoot instantly</span>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="max-w-4xl mx-auto px-6 text-center space-y-6 pt-4">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-[#1A202C]">
            Your business already exists. Let's give it a professional digital home.
          </h2>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#3498E3]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Rocket className="w-4 h-4" />
              <span>Start Free</span>
            </Link>

            <Link
              href="/importer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#F7FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#1A202C] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Globe className="w-4 h-4 text-[#0D5771]" />
              <span>Revamp My Website</span>
            </Link>
          </div>

          <p className="text-xs text-[#0D5771] font-mono font-bold tracking-wider uppercase pt-2">
            Choose it. Import it. Cuzmify it. Launch it. Grow it.
          </p>
        </div>
      </section>
    </div>
  );
}
