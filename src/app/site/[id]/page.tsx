import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { RESPONSIVE_CORE_CSS } from '@/core/responsive-core';
import { renderTemplateEngine, resolveTemplateEngineId, TEMPLATE_ENGINES } from '@/core/template-engines';
import { PublicEnquiryRuntime } from '@/components/public-site/PublicEnquiryRuntime';

interface SitePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id },
    select: { name: true, category: true },
  });

  if (!site) {
    return { title: 'Site Not Found — Cuzmify' };
  }

  return {
    title: `${site.name} — Official Website`,
    description: `Explore ${site.name} (${site.category}) — portfolio, packages & direct WhatsApp enquiries.`,
  };
}

export default async function PublicSitePage({ params }: SitePageProps) {
  const { id } = await params;
  const site = await prisma.site.findUnique({ where: { id } });

  if (!site) notFound();

  let finalHtml = site.htmlContent || '';
  let tplId = resolveTemplateEngineId((site as any).templateId || site.template);

  if (!finalHtml && site.blueprintData) {
    try {
      const bp = JSON.parse(site.blueprintData);
      const rendered = renderTemplateEngine(bp.templateId || tplId, bp, { siteId: site.id });
      finalHtml = rendered.fullHtml;
      tplId = rendered.templateId;
    } catch {}
  }

  if (!finalHtml) notFound();

  const fontUrl = TEMPLATE_ENGINES[tplId]?.googleFontsUrl || TEMPLATE_ENGINES['editorial-atelier'].googleFontsUrl;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={fontUrl} rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_CORE_CSS }} />
      <main
        className="min-h-screen w-full bg-white text-[#1A202C] antialiased"
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />
      <PublicEnquiryRuntime
        siteId={site.id}
        businessName={site.name}
        whatsappPhone={site.whatsappPhone}
      />
    </>
  );
}
