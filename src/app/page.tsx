import React from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { RevampUrlForm } from '@/components/importer/RevampUrlForm';
import {
  Sparkles,
  ArrowRight,
  Globe,
  Layers,
  Rocket,
  ShieldCheck,
  Zap,
  ShoppingBag,
  RefreshCw,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-600/30 via-indigo-600/20 to-amber-500/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-amber-400 backdrop-blur-xl shadow-xl">
            <Sparkles className="w-4 h-4" />
            <span>Introducing Cuzmify 3.0 Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-display text-white leading-[1.1]">
            Turn Your Business Idea Into A Live{' '}
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-amber-400 bg-clip-text text-transparent">
              Digital Business.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Not just a website builder. Discover engineered products, import existing assets or legacy sites, customize with AI, attach modular capabilities, and deploy to production effortlessly.
          </p>

          {/* Dual Entry Points */}
          <div className="pt-6 space-y-8 max-w-3xl mx-auto">
            {/* Entry Point B: URL Revamp Importer */}
            <div className="bg-[#131A29]/90 border border-slate-800 p-6 rounded-3xl shadow-2xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between text-left">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-brand-400" />
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
                href="/editor"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-base shadow-2xl shadow-brand-500/30 flex items-center gap-3 transition-all hover:scale-[1.02]"
              >
                <Rocket className="w-5 h-5" />
                <span>Start New Project</span>
              </Link>
              <Link
                href="/marketplace"
                className="px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-base flex items-center gap-3 transition-all"
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
          <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">
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
              color: 'text-brand-400',
              desc: 'Bring your Instagram photos, WhatsApp contacts, business descriptions, or paste your legacy website URL for AI extraction.',
            },
            {
              step: '03',
              title: 'Cuzmify It',
              icon: Sparkles,
              color: 'text-indigo-400',
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
                  <span className="text-3xl font-extrabold font-mono text-slate-700 group-hover:text-slate-500 transition-colors">
                    {item.step}
                  </span>
                  <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 ${item.color}`}>
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
        <div className="bg-gradient-to-br from-[#131A29] via-[#0D1321] to-[#070A10] p-8 md:p-12 rounded-3xl border border-slate-800 space-y-8">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
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
              <div key={cat} className="flex items-center gap-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
