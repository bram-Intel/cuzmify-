import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { RESPONSIVE_CORE_CSS } from '@/core/responsive-core';

interface SitePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { id } = await params;
  const site = await prisma.site.findUnique({
    where: { id },
    select: { name: true, category: true, template: true },
  });

  if (!site) {
    return {
      title: 'Site Not Found — Cuzmify',
    };
  }

  return {
    title: `${site.name} — Official Website`,
    description: `Welcome to ${site.name}. Powered by Cuzmify Composable Website Studio.`,
  };
}

export default async function PublicSitePage({ params }: SitePageProps) {
  const { id } = await params;

  const site = await prisma.site.findUnique({
    where: { id },
  });

  if (!site || !site.htmlContent) {
    notFound();
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Space+Grotesk:wght@300..700&family=Syne:wght@400..800&display=swap"
        rel="stylesheet"
      />
      <style
        dangerouslySetInnerHTML={{
          __html: RESPONSIVE_CORE_CSS,
        }}
      />
      <main
        className="min-h-screen w-full bg-white text-[#1A202C] antialiased"
        dangerouslySetInnerHTML={{ __html: site.htmlContent }}
      />
    </>
  );
}
