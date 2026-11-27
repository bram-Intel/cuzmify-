import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { InstagramImporter } from '@/services/importer/instagram-importer';
import type { MediaVaultAsset } from '@/core/blueprint-schema';
import { mergeInstagramMediaIntoVault } from '@/lib/media-vault-merge';

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
      return NextResponse.json({ error: 'Unauthorized: Please sign in first.' }, { status: 401 });
    }

    const body = await req.json();
    const { siteId, handle: rawHandle } = body;
    const providedHandle = rawHandle ? InstagramImporter.cleanHandle(rawHandle) : undefined;

    let site = siteId && siteId !== 'proj_default'
      ? await prisma.site.findUnique({ where: { id: siteId } })
      : null;

    if (site && site.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!site) {
      site = await prisma.site.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (!site || !site.instagramToken || site.instagramToken === 'demo_token_authenticated') {
      return NextResponse.json(
        {
          error: 'Instagram is not authorized yet. Tap "Authorize & Import Real Posts" to connect your Instagram Business or Creator account.',
          requiresOAuth: true,
        },
        { status: 400 }
      );
    }

    const targetHandle = providedHandle || site.instagramHandle || 'creator';
    let freshAssets: MediaVaultAsset[] = [];

    const mediaRes = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}&access_token=${site.instagramToken}&limit=30`
    );

    if (!mediaRes.ok) {
      return NextResponse.json(
        {
          error: 'Your Instagram connection expired. Please tap "Authorize & Import Real Posts" to reconnect.',
          requiresOAuth: true,
        },
        { status: 401 }
      );
    }

    const mediaData = await mediaRes.json();
    freshAssets = InstagramImporter.parseInstagramGraphMedia(mediaData.data || [], targetHandle, site.id);

    let currentBlueprint: any = {};
    if (site.blueprintData) {
      try {
        currentBlueprint = JSON.parse(site.blueprintData);
      } catch {}
    }

    const mergedVault = mergeInstagramMediaIntoVault(currentBlueprint.mediaVault, freshAssets, 30);

    currentBlueprint.mediaVault = mergedVault;
    if (!currentBlueprint.profile) currentBlueprint.profile = {};
    currentBlueprint.profile.instagram = targetHandle;
    currentBlueprint.profile.instagramHandle = targetHandle;
    currentBlueprint.updatedAt = new Date().toISOString();

    await prisma.site.update({
      where: { id: site.id },
      data: {
        instagramHandle: targetHandle,
        blueprintData: JSON.stringify(currentBlueprint),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      handle: targetHandle,
      syncedCount: freshAssets.length,
      mediaVault: mergedVault,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API /api/sites/sync-assets Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to refresh Instagram assets' },
      { status: 500 }
    );
  }
}
