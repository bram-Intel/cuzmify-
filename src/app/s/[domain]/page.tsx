import React from 'react';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { RESPONSIVE_CORE_CSS } from '@/core/responsive-core';
import { renderTemplateEngine, resolveTemplateEngineId, TEMPLATE_ENGINES } from '@/core/template-engines';
import Link from 'next/link';
import { Sparkles, ArrowRight, Globe } from 'lucide-react';

interface SubdomainPageProps {
  params: Promise<{ domain: string }>;
}

/** Fetch site by subdomain, custom domain, id, or normalized name */
async function getSiteByDomain(domainSlug: string) {
  const normalized = decodeURIComponent(domainSlug).toLowerCase().trim();

  // 1. Direct subdomain match (prioritize latest updated site)
  let site = await prisma.site.findFirst({
    where: {
      OR: [
        { subdomain: { equals: normalized, mode: 'insensitive' } },
        { customDomain: { equals: normalized, mode: 'insensitive' } },
        { domain: { equals: normalized, mode: 'insensitive' } },
        { id: normalized },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });

  // 2. If not found, try matching by business name slug
  if (!site) {
    const allSites = await prisma.site.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        htmlContent: true,
        blueprintData: true,
        templateId: true,
        plan: true,
        theme: true,
        category: true,
        template: true,
        status: true,
        liveUrl: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    site = allSites.find((s: { name: string }) => {
      const slug = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const slugWithHyphens = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return slug === normalized.replace(/[^a-z0-9]/g, '') || slugWithHyphens === normalized;
    }) as any || null;
  }

  return site;
}

export async function generateMetadata({ params }: SubdomainPageProps): Promise<Metadata> {
  const { domain } = await params;
  const site = await getSiteByDomain(domain);

  if (!site) {
    return {
      title: `${domain} — Powered by Cuzmify`,
      description: `Explore ${domain} on Cuzmify. Fast, responsive, and composable online business experience.`,
    };
  }

  return {
    title: `${site.name} — Official Website`,
    description: `Welcome to ${site.name}. Book instant appointments, explore services & shop online. Powered by Cuzmify.`,
    openGraph: {
      title: `${site.name} — Official Website`,
      description: `Welcome to ${site.name}. Powered by Cuzmify.`,
      siteName: site.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${site.name} — Official Website`,
      description: `Welcome to ${site.name}. Powered by Cuzmify.`,
    },
  };
}

export default async function SubdomainSitePage({ params }: SubdomainPageProps) {
  const { domain } = await params;
  const site = await getSiteByDomain(domain);

  // Resolve HTML from htmlContent or dynamically from blueprintData via Template Engine
  let finalHtml = site?.htmlContent || '';
  let resolvedTplId = resolveTemplateEngineId((site as any)?.templateId || site?.template);

  if (site && !finalHtml && (site as any).blueprintData) {
    try {
      const bp = JSON.parse((site as any).blueprintData);
      const rendered = renderTemplateEngine(bp.templateId || resolvedTplId, bp, { siteId: site.id });
      finalHtml = rendered.fullHtml;
      resolvedTplId = rendered.templateId;
    } catch {}
  }

  // If site not published yet or not found, show elegant placeholder
  if (!site || !finalHtml) {
    const displayDomain = decodeURIComponent(domain);
    return (
      <div className="min-h-screen bg-[#071318] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0D212A] border border-[#163847] shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0D5771] to-[#3498E3] mx-auto flex items-center justify-center shadow-lg shadow-[#0D5771]/30">
            <Globe className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#38BDF8] font-mono px-3 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/20 inline-block">
              CUZMIFY RESERVED DOMAIN
            </span>
            <h1 className="text-2xl font-black font-display tracking-tight text-white capitalize">
              {displayDomain}
            </h1>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              This space is reserved for a future website powered by <strong className="text-[#38BDF8]">Cuzmify</strong>.
            </p>
          </div>

          <div className="pt-4 border-t border-[#163847]/80 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3.5 px-6 rounded-xl bg-[#0D5771] hover:bg-[#116e8f] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Build Your Website on Cuzmify
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fontUrl = TEMPLATE_ENGINES[resolvedTplId]?.googleFontsUrl || TEMPLATE_ENGINES['editorial-atelier'].googleFontsUrl;
  const isProSite = (site as any).plan === 'pro';

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontUrl} rel="stylesheet" />
      <style
        dangerouslySetInnerHTML={{
          __html: RESPONSIVE_CORE_CSS,
        }}
      />

      {/* Live Site Canvas */}
      <main
        suppressHydrationWarning
        className="min-h-screen w-full bg-white text-[#1A202C] antialiased"
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />

      {/* Viral Growth Badge on Free Plan Sites (Removed automatically on Pro) */}
      {!isProSite && (
        <div className="fixed bottom-3 right-3 z-[9999] pointer-events-auto">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Create your own portfolio & booking website free on Cuzmify"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D212A]/90 hover:bg-[#0D212A] text-white text-[10px] font-bold shadow-lg border border-[#163847] backdrop-blur-md transition-all hover:scale-105"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#94A3B8]">Built with</span>
            <span className="text-[#38BDF8] font-extrabold tracking-wide">CUZMIFY</span>
          </Link>
        </div>
      )}
    </>
  );
}
