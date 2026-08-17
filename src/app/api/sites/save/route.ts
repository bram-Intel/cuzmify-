import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { siteId, name, template, category, htmlContent, grapesData, theme, domain } = body;

    // 1. Determine user ID (logged-in user or default local user)
    let userId = session?.user?.id;

    if (!userId) {
      // Find or create a default primary user for local development if not logged in
      const defaultUser = await prisma.user.upsert({
        where: { email: 'creator@cuzmify.local' },
        update: {},
        create: {
          email: 'creator@cuzmify.local',
          name: 'Cuzmify Creator',
          onboardingDone: true,
        },
      });
      userId = defaultUser.id;
    }

    // 2. Upsert Site in database
    const targetId = siteId && siteId !== 'proj_default' ? siteId : undefined;

    let savedSite;
    if (targetId) {
      savedSite = await prisma.site.upsert({
        where: { id: targetId },
        update: {
          name: name || 'Glory Beauty Studio',
          template: template || 'Modern Business Template',
          category: category || 'Beauty & Wellness',
          htmlContent: htmlContent || undefined,
          grapesData: grapesData ? JSON.stringify(grapesData) : undefined,
          theme: theme || 'bram-light',
          domain: domain || undefined,
          updatedAt: new Date(),
        },
        create: {
          id: targetId,
          userId,
          name: name || 'Glory Beauty Studio',
          template: template || 'Modern Business Template',
          category: category || 'Beauty & Wellness',
          htmlContent: htmlContent || undefined,
          grapesData: grapesData ? JSON.stringify(grapesData) : undefined,
          theme: theme || 'bram-light',
          domain: domain || undefined,
        },
      });
    } else {
      // Find latest site for this user or create a new one
      const existing = await prisma.site.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (existing) {
        savedSite = await prisma.site.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            htmlContent: htmlContent || existing.htmlContent,
            grapesData: grapesData ? JSON.stringify(grapesData) : existing.grapesData,
            theme: theme || existing.theme,
            updatedAt: new Date(),
          },
        });
      } else {
        savedSite = await prisma.site.create({
          data: {
            userId,
            name: name || 'Glory Beauty Studio',
            template: template || 'Modern Business Template',
            category: category || 'Beauty & Wellness',
            htmlContent: htmlContent || undefined,
            grapesData: grapesData ? JSON.stringify(grapesData) : undefined,
            theme: theme || 'bram-light',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      site: savedSite,
      message: 'Saved to cloud database',
    });
  } catch (err: any) {
    console.error('[API /api/sites/save Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to save site to database' },
      { status: 500 }
    );
  }
}
