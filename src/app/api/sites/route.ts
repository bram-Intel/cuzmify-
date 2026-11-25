import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { InstagramImporter } from '@/services/importer/instagram-importer';
import { createDefaultBlueprint, type CurrencyCode, type MediaVaultAsset } from '@/core/blueprint-schema';

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

    // Hydrate Instagram token & media across stateless serverless invocations via onboarding cookies
    let hydratedMedia: MediaVaultAsset[] = rawIg ? (InstagramImporter.getCachedMedia(rawIg) || []) : [];
    let onboardingIgToken: string | undefined;
    let onboardingIgExpiresAt: Date | undefined;

    try {
      const cookieStore = await cookies();
      const mediaCookie = cookieStore.get('cuzmify_ig_media')?.value;
      if (hydratedMedia.length === 0 && mediaCookie) {
        const parsed = JSON.parse(mediaCookie);
        if (Array.isArray(parsed) && parsed.length > 0) {
          hydratedMedia = parsed;
        }
      }
      const tokenCookie = cookieStore.get('cuzmify_ig_token')?.value;
      if (tokenCookie) {
        const parsedTok = JSON.parse(tokenCookie);
        if (parsedTok?.accessToken && (!rawIg || !parsedTok?.handle || parsedTok.handle === rawIg)) {
          onboardingIgToken = parsedTok.accessToken;
          if (parsedTok.expiresAt) onboardingIgExpiresAt = new Date(parsedTok.expiresAt);
        }
      }
    } catch {}

    const initialBp = createDefaultBlueprint({
      name: siteName,
      category,
      nicheId,
      templateId,
      currency,
      whatsapp: whatsappPhone,
      instagramHandle: rawIg,
      mediaVault: hydratedMedia,
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
        ...(onboardingIgToken ? { instagramToken: onboardingIgToken } : {}),
        ...(onboardingIgExpiresAt ? { instagramTokenExpiresAt: onboardingIgExpiresAt } : {}),
        blueprintData: JSON.stringify(initialBp),
      },
    });

    // Bind concrete siteId into /api/media/ig proxy URLs so public sites self-heal IG images seamlessly
    if (rawIg && hydratedMedia.length > 0) {
      const boundVault = InstagramImporter.bindSiteIdToVault(hydratedMedia, newSite.id, rawIg);
      const updatedBp = { ...initialBp, mediaVault: boundVault };
      await prisma.site.update({
        where: { id: newSite.id },
        data: { blueprintData: JSON.stringify(updatedBp) },
      });
    }

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
