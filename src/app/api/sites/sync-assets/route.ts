import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { InstagramImporter } from '@/services/importer/instagram-importer';
import type { MediaVaultAsset } from '@/core/blueprint-schema';

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
    const siteId = body.siteId;
    const providedHandle = body.handle ? InstagramImporter.cleanHandle(body.handle) : undefined;

    // 1. Resolve site (support proj_default, explicit ID, or most recent site)
    let site = siteId && siteId !== 'proj_default'
      ? await prisma.site.findUnique({ where: { id: siteId } })
      : null;

    if (!site && userId) {
      site = await prisma.site.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (!site) {
      // Create initial site for user so assets can be attached immediately
      const initialSubdomain = `studio-${Date.now().toString().slice(-4)}`;
      site = await prisma.site.create({
        data: {
          id: siteId && siteId !== 'proj_default' ? siteId : undefined,
          userId,
          name: 'My Business Studio',
          subdomain: initialSubdomain,
          domain: `${initialSubdomain}.cuzmify.com`,
          status: 'draft',
          liveUrl: `/s/${initialSubdomain}`,
        },
      });
    }

    const targetHandle = providedHandle || site.instagramHandle;

    if (!targetHandle) {
      return NextResponse.json({
        error: 'Please provide an Instagram handle to sync.',
      }, { status: 400 });
    }

    let freshAssets: MediaVaultAsset[] = [];

    // If we have an active Meta token and not demo
    if (site.instagramToken && site.instagramToken !== 'demo_token_authenticated') {
      try {
        const mediaRes = await fetch(
          `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${site.instagramToken}&limit=16`
        );
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          freshAssets = (mediaData.data || [])
            .map((m: any, idx: number) => ({
              id: `ig-live-${m.id || Date.now()}-${idx}`,
              url: m.media_url || m.thumbnail_url || '',
              name: m.caption ? m.caption.slice(0, 40) : `Instagram Post #${idx + 1}`,
              type: idx === 0 ? ('hero' as const) : ('gallery' as const),
              source: 'instagram' as const,
              caption: m.caption || `Post from @${targetHandle}`,
              instagramPostUrl: m.permalink || `https://instagram.com/${targetHandle}`,
              addedAt: m.timestamp || new Date().toISOString(),
            }))
            .filter((m: MediaVaultAsset) => Boolean(m.url));
        }
      } catch (metaErr) {
        console.warn('[Sync Assets Meta Graph Warning]:', metaErr);
      }
    }

    // Fallback if token expired or demo mode
    if (freshAssets.length === 0) {
      const importResult = await InstagramImporter.ingestProfile(targetHandle, (site.currency as any) || 'USD');
      freshAssets = importResult.mediaVault;
    }

    // Merge fresh assets into existing blueprintData.mediaVault
    let currentBlueprint: any = {};
    if (site.blueprintData) {
      try {
        currentBlueprint = JSON.parse(site.blueprintData);
      } catch {}
    }

    const existingVault: MediaVaultAsset[] = currentBlueprint.mediaVault || [];
    // Retain custom uploads while replacing / updating Instagram assets
    const nonIgAssets = existingVault.filter((a) => a.source !== 'instagram');
    const updatedVault = [...freshAssets, ...nonIgAssets];

    currentBlueprint.mediaVault = updatedVault;

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
      mediaVault: updatedVault,
      message: `Successfully synced ${freshAssets.length} assets for @${targetHandle}!`,
    });
  } catch (err: any) {
    console.error('[API /api/sites/sync-assets Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to sync project assets' }, { status: 500 });
  }
}
