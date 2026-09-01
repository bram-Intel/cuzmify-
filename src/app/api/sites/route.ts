import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id;
    }

    if (!userId) {
      // Unauthenticated callers receive an empty list without exposing multi-tenant data
      return NextResponse.json({ sites: [] });
    }

    const sites = await prisma.site.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ sites });
  } catch (err: any) {
    console.error('[API GET /api/sites Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch sites' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
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

    const body = await req.json().catch(() => ({}));
    const siteName = (body.name || 'My New Studio').trim();
    const category = body.category || 'Beauty & Wellness';
    const template = body.template || 'Modern Business Template';
    const theme = body.theme || 'bram-light';

    // Generate unique subdomain slug
    let baseSlug = siteName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24) || 'studio';
    let uniqueSubdomain = baseSlug;
    let counter = 1;

    while (await prisma.site.findUnique({ where: { subdomain: uniqueSubdomain } })) {
      uniqueSubdomain = `${baseSlug}-${counter++}`;
    }

    const newSite = await prisma.site.create({
      data: {
        userId,
        name: siteName,
        category,
        template,
        theme,
        subdomain: uniqueSubdomain,
        domain: `${uniqueSubdomain}.cuzmify.com`,
        status: 'draft',
        liveUrl: `/s/${uniqueSubdomain}`,
      },
    });

    return NextResponse.json({ success: true, site: newSite });
  } catch (err: any) {
    console.error('[API POST /api/sites Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create new site project' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    let userId = session?.user?.id;

    if (!userId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      userId = user?.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: You must be logged in to delete sites.' }, { status: 401 });
    }

    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');

    if (siteId) {
      // Delete single site owned by user
      await prisma.site.deleteMany({
        where: { id: siteId, userId },
      });
      return NextResponse.json({ success: true, message: 'Website project deleted.' });
    }

    await prisma.site.deleteMany({ where: { userId } });
    return NextResponse.json({ success: true, message: 'All user sites reset successfully.' });
  } catch (err: any) {
    console.error('[API DELETE /api/sites Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete site' }, { status: 500 });
  }
}
