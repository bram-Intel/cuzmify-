'use client';

import React, { useState } from 'react';
import { AIThemeConfig } from '@/core/types';
import {
  Sparkles,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Instagram,
  Heart,
  Award,
} from 'lucide-react';

interface BeautyProTemplateProps {
  config: AIThemeConfig;
  businessName: string;
  activeModules: string[];
}

const GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    title: 'Bridal Airbrush Glam',
    category: 'Bridal',
  },
  {
    url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80',
    title: 'Editorial Bronze Glow',
    category: 'Soft Glam',
  },
  {
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
    title: 'Hollywood Waves & Styling',
    category: 'Hairstyling',
  },
  {
    url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
    title: 'Velvet Matte Evening Look',
    category: 'Full Glam',
  },
];

const SERVICE_MENU = [
  {
    id: 's1',
    category: 'Bridal',
    title: 'Signature Bridal Luxury Suite',
    price: '$350',
    duration: '120 mins',
    description: 'Complete luxury bridal transformation including pre-wedding trial, HD airbrushing, premium silk lashes, and personalized touch-up kit.',
    perks: ['Pre-wedding trial included', '24hr setting lock spray', 'Luxury lip touch-up kit'],
  },
  {
    id: 's2',
    category: 'Soft Glam',
    title: 'Red Carpet Soft Glam',
    price: '$180',
    duration: '75 mins',
    description: 'Radiant skin-focused makeup with subtle contouring, warm neutral eyes, and custom lash extension strips.',
    perks: ['Camera-ready HD finish', 'Custom mink lashes', 'Hydration prep serum'],
  },
  {
    id: 's3',
    category: 'Hairstyling',
    title: 'Hollywood Waves & Crown Styling',
    price: '$220',
    duration: '90 mins',
    description: 'Red-carpet signature Hollywood waves or intricate updo with scalp prep and shine seal.',
    perks: ['Heat protectant seal', 'Volumizing texture spray', 'Pin setting for long hold'],
  },
  {
    id: 's4',
    category: 'Masterclass',
    title: 'Private 1-on-1 Makeup Masterclass',
    price: '$450',
    duration: '3 hours',
    description: 'Intensive hands-on training for aspiring artists. Learn shade matching, skin prep, contouring, and client retention.',
    perks: ['Certificate of completion', 'Product list & vendor guide', 'Lifetime Q&A access'],
  },
];

export const BeautyProTemplate: React.FC<BeautyProTemplateProps> = ({
  config,
  businessName,
  activeModules,
}) => {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const isLight = config.style === 'bram-light' || config.style === 'minimal';

  const bgColor = isLight ? '#FFFFFF' : '#0B0F17';
  const surfaceColor = isLight ? '#F7FAFC' : '#141A25';
  const textColor = isLight ? '#1A202C' : '#FFFFFF';
  const subtextColor = isLight ? '#64748B' : '#94A3B8';
  const borderColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)';
  const accentGold = '#F59E0B';
  const primaryBrand = isLight ? '#0D5771' : config.secondaryColor || accentGold;

  const filteredServices = activeTab === 'ALL'
    ? SERVICE_MENU
    : SERVICE_MENU.filter((s) => s.category.toUpperCase() === activeTab.toUpperCase());

  return (
    <div
      className="w-full min-h-full transition-all duration-300 font-display"
      style={{ backgroundColor: bgColor, color: textColor, fontFamily: config.fontFamily || 'Outfit' }}
    >
      {/* ── 1. LUXURY NAVBAR ─────────────────────────────────────────────────── */}
      <nav
        className="px-6 py-4 flex items-center justify-between border-b backdrop-blur-xl sticky top-0 z-30"
        style={{ backgroundColor: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(11, 15, 23, 0.85)', borderColor }}
      >
        <div className="flex items-center gap-2">
          <span className="font-black text-lg tracking-tight font-display" style={{ color: primaryBrand }}>
            {businessName || 'GLORY BEAUTY STUDIO'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-mono text-[9px] font-bold uppercase tracking-wider border border-amber-500/20">
            VERIFIED PRO
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-6 text-xs font-semibold" style={{ color: subtextColor }}>
          <a href="#services" className="hover:text-amber-500 transition-colors">Services</a>
          <a href="#portfolio" className="hover:text-amber-500 transition-colors">Portfolio</a>
          <a href="#reviews" className="hover:text-amber-500 transition-colors">Reviews</a>
        </div>

        <button
          className="px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.03] flex items-center gap-2"
          style={{ backgroundColor: primaryBrand, color: '#FFFFFF' }}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Session</span>
        </button>
      </nav>

      {/* ── 2. HERO SECTION ──────────────────────────────────────────────────── */}
      <section className="px-6 py-12 sm:py-20 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Headline & CTAs */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Rating Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-amber-700">4.9</span>
            <span className="text-slate-400">•</span>
            <span>312 Verified Reviews</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.15] text-balance">
            {config.heroHeadline || 'Transforming Elegance & Timeless Bridal Glamour.'}
          </h1>

          <p className="text-sm sm:text-base leading-relaxed max-w-xl" style={{ color: subtextColor }}>
            {config.heroSubheadline || 'Bespoke beauty artistry, flawless HD airbrushing, and personalized hair styling for brides, red carpet events, and luxury photoshoots.'}
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              className="px-7 py-3.5 rounded-2xl font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              style={{ backgroundColor: primaryBrand, color: '#FFFFFF' }}
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Book Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20">
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Instant WhatsApp Chat</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="flex items-center gap-6 pt-3 text-[11px]" style={{ color: subtextColor }}>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Sanitized Tools</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Premium Luxury Brands</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Showcase */}
        <div className="lg:col-span-5 relative">
          <div className="relative rounded-3xl overflow-hidden border shadow-2xl group" style={{ borderColor }}>
            <img
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
              alt="Bridal Makeup Portfolio"
              className="w-full h-[400px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Signature Bridal Look</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold uppercase">
                  Available Today
                </span>
              </div>
              <p className="text-[11px] text-slate-300">HD Airbrushing • 24hr Setting Seal • Custom Lashes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SERVICES MENU & PRICING CALCULATOR ────────────────────────────── */}
      <section id="services" className="px-6 py-16 border-t" style={{ backgroundColor: surfaceColor, borderColor }}>
        <div className="max-w-6xl mx-auto space-y-8 text-center">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: primaryBrand }}>
              Service Catalog & Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Bespoke Beauty Experiences
            </h2>
            <p className="text-xs sm:text-sm max-w-lg mx-auto" style={{ color: subtextColor }}>
              Transparent pricing, high-end products, and tailored artistry for every occasion.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {['ALL', 'Bridal', 'Soft Glam', 'Hairstyling', 'Masterclass'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-[#0D5771] text-white shadow-md'
                    : 'bg-white/80 border border-[#E2E8F0] text-[#64748B] hover:text-[#1A202C]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="p-6 rounded-2xl border transition-all hover:shadow-lg flex flex-col justify-between space-y-4"
                style={{ backgroundColor: bgColor, borderColor }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {srv.category}
                      </span>
                      <h3 className="text-base font-bold mt-2 font-display">{srv.title}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-600 font-mono">{srv.price}</span>
                      <span className="block text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 inline" /> {srv.duration}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: subtextColor }}>
                    {srv.description}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    {srv.perks.map((perk, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: subtextColor }}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor }}>
                  <span className="text-[11px] font-mono text-slate-400">Instant Booking Ready</span>
                  <button
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-1.5 shadow-sm"
                    style={{ backgroundColor: primaryBrand, color: '#FFFFFF' }}
                  >
                    <span>Reserve Spot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PORTFOLIO SHOWCASE ────────────────────────────────────────────── */}
      <section id="portfolio" className="px-6 py-16 max-w-6xl mx-auto space-y-8 text-center">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: primaryBrand }}>
            Portfolio Showcase
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Real Client Transformations
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GALLERY_IMAGES.map((img, i) => (
            <div key={i} className="group relative rounded-2xl overflow-hidden border shadow-sm aspect-[4/5]" style={{ borderColor }}>
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-left text-white">
                <span className="text-[10px] font-mono uppercase text-amber-300">{img.category}</span>
                <p className="text-xs font-bold">{img.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
