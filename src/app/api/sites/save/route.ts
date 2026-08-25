import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const body = await req.json();
    const { siteId, name, template, category, htmlContent, grapesData, theme, domain, status, liveUrl } = body;

    // 1. Determine user ID (logged-in user or fallback by email)
    let userId = session?.user?.id;

    if (!userId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id;
    }

    if (!userId) {
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

    // 2. Strict IDOR / BOLA Validation & Persistence
    const targetId = siteId && siteId !== 'proj_default' ? siteId : undefined;

    let savedSite;
    if (targetId) {
      // Check if site already exists in database
      const existing = await prisma.site.findUnique({
        where: { id: targetId },
      });

      if (existing) {
        // Enforce row-level ownership: verify user owns this site
        if (existing.userId !== userId) {
          return NextResponse.json(
            { error: 'Forbidden: You do not have permission to modify this website.' },
            { status: 403 }
          );
        }

        savedSite = await prisma.site.update({
          where: { id: targetId },
          data: {
            name: name || existing.name,
            template: template || existing.template,
            category: category || existing.category,
            htmlContent: htmlContent !== undefined ? htmlContent : existing.htmlContent,
            grapesData: grapesData !== undefined ? (typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData)) : existing.grapesData,
            theme: theme || existing.theme,
            domain: domain !== undefined ? domain : existing.domain,
            status: status || existing.status,
            liveUrl: liveUrl !== undefined ? liveUrl : existing.liveUrl,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new site with explicit ownership
        savedSite = await prisma.site.create({
          data: {
            id: targetId,
            userId,
            name: name || 'Glory Beauty Studio',
            template: template || 'Modern Business Template',
            category: category || 'Beauty & Wellness',
            htmlContent: htmlContent || undefined,
            grapesData: grapesData ? (typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData)) : undefined,
            theme: theme || 'bram-light',
            domain: domain || undefined,
            status: status || 'draft',
            liveUrl: liveUrl || undefined,
          },
        });
      }
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
            htmlContent: htmlContent !== undefined ? htmlContent : existing.htmlContent,
            grapesData: grapesData !== undefined ? (typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData)) : existing.grapesData,
            theme: theme || existing.theme,
            status: status || existing.status,
            liveUrl: liveUrl !== undefined ? liveUrl : existing.liveUrl,
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
            grapesData: grapesData ? (typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData)) : undefined,
            theme: theme || 'bram-light',
            status: status || 'draft',
            liveUrl: liveUrl || undefined,
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
