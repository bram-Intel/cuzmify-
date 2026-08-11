import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { RevampUrlForm } from '@/components/importer/RevampUrlForm';
import {
  Sparkles,
  Globe,
  Layers,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        {/* Cinematic Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-[#0D5771]/40 via-[#3498E3]/25 to-[#72B9F3]/20 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A222E] border border-[#1E3A4A] text-xs font-semibold text-[#72B9F3] backdrop-blur-xl shadow-xl">
            <Sparkles className="w-4 h-4 text-[#3498E3]" />
            <span>Bram Intel Cinematic Architecture 3.0</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-display text-white leading-[1.1]">
            Turn Your Business Idea Into A Live{' '}
            <span className="hero-heading">
              Digital Business.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Not just a website builder. Discover engineered products, import existing assets or legacy sites, customize with AI, attach modular capabilities, and deploy to production effortlessly.
          </p>

          {/* Dual Entry Points */}
          <div className="pt-6 space-y-8 max-w-3xl mx-auto">
            {/* Entry Point B: URL Revamp Importer */}
            <div className="bg-[#0D2A38]/90 border border-[#1E3A4A] p-6 rounded-3xl shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between text-left">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 font-display">
                    <Globe className="w-4 h-4 text-[#72B9F3]" />
                    Entry Point: Revamp An Existing Website
                  </h3>
                  <p className="text-xs text-slate-400">Already have a site? Paste your URL below for instant AI modernization report.</p>
                </div>
              </div>
              <RevampUrlForm />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/onboarding"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0D5771] via-[#3498E3] to-[#72B9F3] hover:opacity-90 text-white font-bold text-base shadow-2xl shadow-[#3498E3]/30 flex items-center gap-3 transition-all hover:scale-[1.02]"
              >
                <Rocket className="w-5 h-5" />
                <span>Start New Project</span>
              </Link>
              <Link
                href="/marketplace"
                className="px-8 py-4 rounded-2xl bg-[#0D2A38] hover:bg-[#0A222E] border border-[#1E3A4A] text-slate-200 font-bold text-base flex items-center gap-3 transition-all"
              >
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>Explore Product Marketplace</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The 6-Step Core Lifecycle Section */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-[#72B9F3] uppercase tracking-widest">
            Core Product Philosophy
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">
            Choose. Import. Cuzmify. Launch. Extend. Grow.
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            A continuous composable journey designed to abstract complex engineering away from non-technical business owners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Choose It',
              icon: ShoppingBag,
              color: 'text-amber-400',
              desc: 'Select a professionally engineered digital product built specifically for your visual service or product category.',
            },
            {
              step: '02',
              title: 'Import It',
              icon: Globe,
              color: 'text-[#72B9F3]',
              desc: 'Bring your Instagram photos, WhatsApp contacts, business descriptions, or paste your legacy website URL for AI extraction.',
            },
            {
              step: '03',
              title: 'Cuzmify It',
              icon: Sparkles,
              color: 'text-[#3498E3]',
              desc: 'Customize colors, typography, layout, and service menus instantly using natural language AI or visual controls.',
            },
            {
              step: '04',
              title: 'Launch It',
              icon: Rocket,
              color: 'text-emerald-400',
              desc: 'Connect a custom domain or free cuzmify.com subdomain. Automated DNS verification and SSL certificate configuration.',
            },
            {
              step: '05',
              title: 'Extend It',
              icon: Layers,
              color: 'text-teal-400',
              desc: 'Attach capabilities such as Catalog, Cart, Orders, Payments, Delivery, and Booking whenever your business grows.',
            },
            {
              step: '06',
              title: 'Grow & Maintain',
              icon: ShieldCheck,
              color: 'text-purple-400',
              desc: 'Automated health monitoring, continuous security updates, AI error diagnosis, and Cuzmify Pro human expert support.',
            },
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <GlassCard key={item.step} className="space-y-4 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold font-mono text-[#1E3A4A] group-hover:text-[#3498E3]/50 transition-colors">
                    {item.step}
                  </span>
                  <div className={`p-3 rounded-xl bg-[#0A222E] border border-[#1E3A4A] ${item.color}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white font-display">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Target Market Showcase */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="bg-gradient-to-br from-[#0D2A38] via-[#0A222E] to-[#041017] p-8 md:p-12 rounded-3xl border border-[#1E3A4A] space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold text-[#72B9F3] uppercase tracking-widest">
              Built for Visual Service & Small Product Businesses
            </span>
            <h2 className="text-3xl font-bold font-display text-white">
              Transform Fragmented Social Media Into Professional Infrastructure
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stop relying solely on direct messages. Turn Instagram photos, WhatsApp inquiries, and customer testimonials into a unified business OS.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-300">
            {['Makeup Artists', 'Hairstylists', 'Event Planners', 'Photographers', 'Boutique Sellers', 'Tailors & Designers', 'Caterers & Chefs', 'Jewelry Sellers'].map((cat) => (
              <div key={cat} className="flex items-center gap-2 bg-[#071A24] p-3 rounded-xl border border-[#1E3A4A]">
                <CheckCircle2 className="w-4 h-4 text-[#72B9F3] flex-shrink-0" />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
