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

    const rawName = name || 'Glory Beauty Studio';
    const computedSubdomain = body.subdomain || (rawName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) || 'studio');

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

        const activeSubdomain = existing.subdomain || computedSubdomain;

        savedSite = await prisma.site.update({
          where: { id: targetId },
          data: {
            name: name || existing.name,
            subdomain: body.subdomain || existing.subdomain || computedSubdomain,
            customDomain: body.customDomain !== undefined ? body.customDomain : existing.customDomain,
            template: template || existing.template,
            category: category || existing.category,
            htmlContent: htmlContent !== undefined ? htmlContent : existing.htmlContent,
            grapesData: grapesData !== undefined ? (typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData)) : existing.grapesData,
            blueprintData: body.blueprintData !== undefined ? (typeof body.blueprintData === 'string' ? body.blueprintData : JSON.stringify(body.blueprintData)) : existing.blueprintData,
            theme: theme || existing.theme,
            instagramHandle: body.instagramHandle !== undefined ? body.instagramHandle : existing.instagramHandle,
            whatsappPhone: body.whatsappPhone !== undefined ? body.whatsappPhone : existing.whatsappPhone,
            currency: body.currency || existing.currency,
            domain: domain !== undefined ? domain : (existing.domain || `${activeSubdomain}.cuzmify.com`),
            status: status || existing.status,
            liveUrl: liveUrl !== undefined ? liveUrl : (existing.liveUrl || `/s/${activeSubdomain}`),
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new site with explicit ownership
        savedSite = await prisma.site.create({
          data: {
            id: targetId,
            userId,
            name: rawName,
            subdomain: computedSubdomain,
            customDomain: body.customDomain || undefined,
            template: template || 'Modern Business Template',
            category: category || 'Beauty & Wellness',
            htmlContent: htmlContent || undefined,
            grapesData: grapesData ? (typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData)) : undefined,
            blueprintData: body.blueprintData ? (typeof body.blueprintData === 'string' ? body.blueprintData : JSON.stringify(body.blueprintData)) : undefined,
            theme: theme || 'bram-light',
            instagramHandle: body.instagramHandle || undefined,
            whatsappPhone: body.whatsappPhone || undefined,
            currency: body.currency || 'USD',
            domain: domain || `${computedSubdomain}.cuzmify.com`,
            status: status || 'draft',
            liveUrl: liveUrl || `/s/${computedSubdomain}`,
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
        const activeSubdomain = existing.subdomain || computedSubdomain;
        savedSite = await prisma.site.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            subdomain: body.subdomain || existing.subdomain || computedSubdomain,
            customDomain: body.customDomain !== undefined ? body.customDomain : existing.customDomain,
            htmlContent: htmlContent !== undefined ? htmlContent : existing.htmlContent,
            grapesData: grapesData !== undefined ? (typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData)) : existing.grapesData,
            blueprintData: body.blueprintData !== undefined ? (typeof body.blueprintData === 'string' ? body.blueprintData : JSON.stringify(body.blueprintData)) : existing.blueprintData,
            theme: theme || existing.theme,
            instagramHandle: body.instagramHandle !== undefined ? body.instagramHandle : existing.instagramHandle,
            whatsappPhone: body.whatsappPhone !== undefined ? body.whatsappPhone : existing.whatsappPhone,
            currency: body.currency || existing.currency,
            domain: domain !== undefined ? domain : (existing.domain || `${activeSubdomain}.cuzmify.com`),
            status: status || existing.status,
            liveUrl: liveUrl !== undefined ? liveUrl : (existing.liveUrl || `/s/${activeSubdomain}`),
            updatedAt: new Date(),
          },
        });
      } else {
        savedSite = await prisma.site.create({
          data: {
            userId,
            name: rawName,
            subdomain: computedSubdomain,
            customDomain: body.customDomain || undefined,
            template: template || 'Modern Business Template',
            category: category || 'Beauty & Wellness',
            htmlContent: htmlContent || undefined,
            grapesData: grapesData ? (typeof grapesData === 'string' ? grapesData : JSON.stringify(grapesData)) : undefined,
            blueprintData: body.blueprintData ? (typeof body.blueprintData === 'string' ? body.blueprintData : JSON.stringify(body.blueprintData)) : undefined,
            theme: theme || 'bram-light',
            instagramHandle: body.instagramHandle || undefined,
            whatsappPhone: body.whatsappPhone || undefined,
            currency: body.currency || 'USD',
            domain: domain || `${computedSubdomain}.cuzmify.com`,
            status: status || 'draft',
            liveUrl: liveUrl || `/s/${computedSubdomain}`,
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
