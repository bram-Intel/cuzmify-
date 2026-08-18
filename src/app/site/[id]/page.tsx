import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

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
    <div
      className="min-h-screen w-full bg-white text-[#1A202C] antialiased"
      dangerouslySetInnerHTML={{ __html: site.htmlContent }}
    />
  );
}
