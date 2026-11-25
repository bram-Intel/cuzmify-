import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { InstagramImporter } from '@/services/importer/instagram-importer';
import { createDefaultBlueprint, type CurrencyCode } from '@/core/blueprint-schema';

async function resolveUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    return user?.id || null;
  }
  return null;
}

export async function GET() {
  try {
    const userId = await resolveUserId();
    if (!userId) {
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
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Please sign in first.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const siteName = (body.name || 'My New Studio').trim();
    const category = body.category || 'Service Business';
    const nicheId = body.nicheId || 'beauty_makeup';
    const templateId = body.templateId || 'editorial-atelier';
    const template = body.template || 'Editorial Atelier';
    const currency: CurrencyCode = body.currency || 'NGN';
    const whatsappPhone = (body.whatsappPhone || body.whatsapp || '').replace(/[^\d]/g, '');
    const rawIg = body.instagramHandle ? InstagramImporter.cleanHandle(body.instagramHandle) : undefined;

    const cachedMedia = rawIg ? (InstagramImporter.getCachedMedia(rawIg) || []) : [];

    const initialBp = createDefaultBlueprint({
      name: siteName,
      category,
      nicheId,
      templateId,
      currency,
      whatsapp: whatsappPhone,
      instagramHandle: rawIg,
      mediaVault: cachedMedia,
    });

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
        nicheId,
        templateId,
        template,
        theme: body.theme || 'bram-light',
        currency,
        whatsappPhone: whatsappPhone || undefined,
        subdomain: uniqueSubdomain,
        domain: `${uniqueSubdomain}.cuzmify.com`,
        status: 'draft',
        liveUrl: `/s/${uniqueSubdomain}`,
        instagramHandle: rawIg || undefined,
        blueprintData: JSON.stringify(initialBp),
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
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: You must be logged in to delete sites.' }, { status: 401 });
    }

    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');

    if (siteId) {
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
