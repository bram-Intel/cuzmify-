import React from 'react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { HeroCanvasBackground } from '@/components/ui/HeroCanvasBackground';
import { CUZMIFY_MODULES } from '@/modules/module-registry';
import { Layers, ShieldCheck, ExternalLink, Zap, Plus, Globe, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ProjectManagerSection } from '@/components/dashboard/ProjectManagerSection';

export interface SiteRecord {
  id: string;
  userId: string;
  name: string;
  subdomain?: string | null;
  customDomain?: string | null;
  domain?: string | null;
  template: string;
  category: string;
  status: string;
  liveUrl?: string | null;
  theme?: string | null;
  grapesData?: string | null;
  htmlContent?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const metadata = {
  title: 'Dashboard — Cuzmify',
  description: 'Manage your active websites, composable modules, and live deployments.',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const userId = session.user.id;

  const rawSites = userId
    ? await prisma.site.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      })
    : [];

  const sites: SiteRecord[] = (rawSites as unknown as SiteRecord[]) || [];

  const primarySite = sites[0] ?? {
    id: 'proj_default',
    name: session.user.name ? `${session.user.name}'s Studio` : 'My Digital Studio',
    template: 'Modern Business Template',
    category: 'General',
    status: 'draft',
    liveUrl: null,
    domain: null,
    theme: 'bram-light',
    grapesData: null,
    updatedAt: new Date(),
  };

  const isLive = primarySite.status === 'live';

  // ── Parse Real Blueprint Context ──
  let attachedModuleTypes: string[] = ['CATALOG', 'BOOKING']; // Core attached by default
  let businessCurrency = 'USD';
  let totalServicesCount: number | null = null;
  let totalProductsCount: number | null = null;

  if (primarySite.grapesData) {
    try {
      const parsed = typeof primarySite.grapesData === 'string' ? JSON.parse(primarySite.grapesData) : primarySite.grapesData;
      const bp = parsed?.blueprint || parsed?.blueprintData || (parsed?.profile || parsed?.modules ? parsed : null);
      if (bp) {
        if (bp.profile?.currency) {
          businessCurrency = bp.profile.currency;
        }
        if (bp.modules?.services?.items?.length) {
          totalServicesCount = bp.modules.services.items.length;
        }
        if (bp.modules?.products?.items?.length) {
          totalProductsCount = bp.modules.products.items.length;
        }
        attachedModuleTypes = [];
        if (totalServicesCount || totalProductsCount) attachedModuleTypes.push('CATALOG');
        if (bp.modules?.whatsapp?.enabled !== false) attachedModuleTypes.push('BOOKING');
        if (bp.modules?.cart?.enabled) attachedModuleTypes.push('CART');
        if (bp.modules?.payments?.enabled) attachedModuleTypes.push('PAYMENTS');
      }
    } catch {
      // fallback
    }
  }

  // Modules not yet available in current engine version
  const NOT_AVAILABLE_MODULES = ['ORDERS', 'DELIVERY', 'ANALYTICS'];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A202C] relative overflow-hidden pb-32">
      {/* Background Particle Mesh Canvas */}
      <HeroCanvasBackground />

      {/* Radial Dot Grid Background Mask */}
      <div className="absolute inset-0 bg-[radial-gradient(#0D5771_0.65px,transparent_0.65px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 space-y-10 relative z-10">
        
        {/* Dashboard Top Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#F7FAFC] p-6 rounded-3xl border border-[#E2E8F0] shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] font-display">
                {primarySite.name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-xs border flex items-center gap-1.5 ${
                  isLive
                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isLive ? 'LIVE • EDGE CDN' : 'DRAFT IN STUDIO'}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1 font-mono">
              Template: {primarySite.template} • Category: {primarySite.category}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/studio?projectId=${primarySite.id}`}
              className="px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#1A202C] font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Zap className="w-4 h-4 text-[#0D5771]" />
              <span>Open in Studio</span>
            </Link>

            <Link
              href={`/site/${primarySite.id}`}
              target="_blank"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#3498E3]/20 transition-all"
            >
              <span>View Public Site</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* All Projects / Sites Manager */}
        <ProjectManagerSection sites={sites} />

        {/* Quick Launch Starter Blueprints */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1A202C] font-display flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0D5771]" />
              <span>Launch New Blueprint</span>
            </h2>
            <Link
              href="/marketplace"
              className="text-xs font-bold text-[#0D5771] hover:underline"
            >
              Browse All Blueprints →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Luxury Beauty & Spa', cat: 'Beauty', template: 'Glory Beauty Studio', theme: 'luxury' },
              { title: 'Monaco Supercar Club', cat: 'Automotive', template: 'Monaco Supercar Club', theme: 'dark-obsidian' },
              { title: 'Bespoke Bridal Atelier', cat: 'Weddings', template: 'Bridal Atelier Studio', theme: 'editorial' },
              { title: 'Modern Creative Agency', cat: 'Digital', template: 'Modern Creative Studio', theme: 'bram-light' },
            ].map((bp) => (
              <Link
                key={bp.title}
                href={`/studio?template=${encodeURIComponent(bp.template)}&category=${encodeURIComponent(bp.cat)}`}
                className="bg-white p-4 rounded-2xl border border-[#E2E8F0] hover:border-[#0D5771] hover:shadow-md transition-all group space-y-2 block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase">{bp.cat}</span>
                  <span className="text-[10px] font-bold text-[#0D5771] group-hover:translate-x-0.5 transition-transform">Start →</span>
                </div>
                <h3 className="font-bold text-sm text-[#1A202C] group-hover:text-[#0D5771] transition-colors">{bp.title}</h3>
                <p className="text-[11px] text-[#64748B]">Pre-engineered responsive layout with WhatsApp booking integration.</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Composable Capabilities Module Manager */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1A202C] font-display flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0D5771]" />
                <span>Attached Composable Capabilities</span>
              </h2>
              <p className="text-xs text-[#64748B]">
                Attach, detach, replace or extend modules without rebuilding your digital business.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(CUZMIFY_MODULES).map((mod) => {
              const isNotAvailable = NOT_AVAILABLE_MODULES.includes(mod.type);
              const isAttached = !isNotAvailable && attachedModuleTypes.includes(mod.type);
              const isAvailable = !isNotAvailable && !isAttached;

              return (
                <SpotlightCard
                  key={mod.type}
                  className={`p-5 rounded-2xl bg-[#FFFFFF] border-[#E2E8F0] space-y-4 flex flex-col justify-between shadow-sm ${
                    isNotAvailable ? 'opacity-70 bg-slate-50/50' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                        {mod.category}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isAttached
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isAvailable
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {isAttached ? 'ATTACHED' : isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}
                      </span>
                    </div>
                    <h3 className={`text-base font-bold font-display ${isNotAvailable ? 'text-slate-500' : 'text-[#1A202C]'}`}>
                      {mod.name}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{mod.description}</p>
                  </div>

                  {isNotAvailable ? (
                    <span className="w-full py-2 rounded-xl text-xs font-bold text-center block bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none">
                      -
                    </span>
                  ) : (
                    <Link
                      href={`/studio?projectId=${primarySite.id}`}
                      className={`w-full py-2 rounded-xl text-xs font-bold text-center block transition-all ${
                        isAttached
                          ? 'bg-[#FFFFFF] text-[#1A202C] border border-[#E2E8F0] hover:border-slate-300 shadow-2xs'
                          : 'bg-[#0D5771] text-white hover:bg-[#083D50]'
                      }`}
                    >
                      {isAttached ? 'Configure in Studio' : 'Attach Capability'}
                    </Link>
                  )}
                </SpotlightCard>
              );
            })}
          </div>
        </div>

        {/* Real Production Telemetry & Diagnostics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SpotlightCard className="p-6 rounded-2xl bg-[#FFFFFF] border-[#E2E8F0] space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0D5771]" />
              <h3 className="text-base font-bold text-[#1A202C] font-display">Database &amp; Project Health</h3>
            </div>
            <div className="space-y-2 font-mono text-xs text-[#1A202C] bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Database Connection:</span>
                <span className="text-emerald-700 font-bold">PostgreSQL Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Project ID:</span>
                <span className="text-[#0D5771] font-bold">{primarySite.id ? `${primarySite.id.slice(0, 16)}...` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Active Theme:</span>
                <span className="capitalize font-bold">{primarySite.theme || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Primary Currency:</span>
                <span className="font-bold text-slate-800">{businessCurrency || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Active Services:</span>
                <span className="font-bold text-slate-800">{totalServicesCount !== null ? totalServicesCount : '-'}</span>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-6 rounded-2xl bg-[#FFFFFF] border-[#E2E8F0] space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-[#1A202C] font-display">Hosting &amp; Edge CDN</h3>
            </div>
            <div className="space-y-2 text-xs text-[#1A202C] bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0] font-mono">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Custom Domain:</span>
                <span className="text-slate-800 font-bold">{primarySite.domain || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Hosting Environment:</span>
                <span>{isLive ? 'Vercel Global Edge Network' : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Deployment Status:</span>
                <span className={isLive ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {isLive ? 'Deployed & Serving' : 'Staged Draft'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">SSL / TLS Encryption:</span>
                <span className={isLive ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                  {isLive ? 'Active (HTTPS Enabled)' : '-'}
                </span>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
