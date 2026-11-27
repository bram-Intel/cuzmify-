import React from 'react';
import { HeroCanvasBackground } from '@/components/ui/HeroCanvasBackground';
import { ExternalLink, Zap, Plus } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ProjectManagerSection } from '@/components/dashboard/ProjectManagerSection';
import { EnquiryInboxSection, type EnquiryItem } from '@/components/dashboard/EnquiryInboxSection';

export interface SiteRecord {
  id: string;
  userId: string;
  name: string;
  subdomain?: string | null;
  customDomain?: string | null;
  domain?: string | null;
  template: string;
  templateId?: string | null;
  nicheId?: string | null;
  plan?: string | null;
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
  title: 'My Dashboard — Cuzmify',
  description: 'Manage your portfolio websites, Instagram sync, and client enquiries.',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  let userId = session.user.id;
  if (!userId && session.user.email) {
    const u = await prisma.user.findUnique({ where: { email: session.user.email } });
    userId = u?.id;
  }

  const rawSites = userId
    ? await prisma.site.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          name: true,
          subdomain: true,
          customDomain: true,
          domain: true,
          template: true,
          templateId: true,
          nicheId: true,
          plan: true,
          category: true,
          status: true,
          liveUrl: true,
          theme: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : [];

  const sites: SiteRecord[] = (rawSites as unknown as SiteRecord[]) || [];

  let enquiries: EnquiryItem[] = [];
  if (userId) {
    try {
      const rawEnq = await prisma.enquiry.findMany({
        where: { site: { userId } },
        include: { site: { select: { id: true, name: true, subdomain: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      enquiries = rawEnq.map((e: any) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      }));
    } catch {
      // Safe fallback before Enquiry migration is pushed
    }
  }

  const primarySite = sites[0] ?? null;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const primarySlug = primarySite
    ? (primarySite.subdomain || primarySite.name.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 30) || primarySite.id
    : '';
  const primaryDisplayDomain = primarySite
    ? primarySite.customDomain || (rootDomain ? `${primarySlug}.${rootDomain}` : `/s/${primarySite.subdomain || primarySite.id}`)
    : '';
  const primaryLiveHref = primarySite
    ? primarySite.customDomain
      ? `https://${primarySite.customDomain}`
      : rootDomain
        ? `https://${primarySlug}.${rootDomain}`
        : `/s/${primarySite.subdomain || primarySite.id}`
    : '/';

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A202C] relative overflow-hidden pb-24">
      <HeroCanvasBackground />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8 relative z-10">
        {/* Top Action Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F8FAFC] p-5 sm:p-6 rounded-3xl border border-[#E2E8F0] shadow-2xs">
          {primarySite ? (
            <>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A202C] font-display">
                    {primarySite.name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border flex items-center gap-1.5 ${
                      primarySite.status === 'live'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        primarySite.status === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {primarySite.status === 'live' ? 'LIVE' : 'DRAFT'}
                  </span>
                  {primarySite.plan === 'pro' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0D5771] text-white">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] font-mono">
                  {primaryDisplayDomain} • {primarySite.category}
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Link
                  href={`/studio?projectId=${primarySite.id}`}
                  className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F1F5F9] border border-[#CBD5E1] text-[#1A202C] font-bold text-xs flex items-center gap-1.5 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 text-[#0D5771]" />
                  <span>Edit Site</span>
                </Link>

                <Link
                  href={primaryLiveHref}
                  target="_blank"
                  className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-[#0D5771] hover:bg-[#083D50] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <span>Open Live Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-extrabold text-[#1A202C] font-display">Welcome to Cuzmify</h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Connect your Instagram and launch your first service portfolio website in 3 minutes.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="px-5 py-2.5 rounded-xl bg-[#0D5771] text-white font-bold text-xs flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Website</span>
              </Link>
            </div>
          )}
        </div>

        {/* Client Enquiries Inbox */}
        <EnquiryInboxSection initialEnquiries={enquiries} />

        {/* All Websites Manager */}
        <ProjectManagerSection sites={sites} />
      </div>
    </div>
  );
}
