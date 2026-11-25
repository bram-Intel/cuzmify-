import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Checks whether a Meta/Instagram CDN URL (`oe=<hex_unix_seconds>`) is still fresh
 * with at least 30 minutes of remaining validity.
 */
function isMetaCdnUrlFresh(rawUrl?: string | null): boolean {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    const oeHex = parsed.searchParams.get('oe');
    if (!oeHex) {
      // Non-expiring external URL
      return !parsed.hostname.includes('cdninstagram.com') && !parsed.hostname.includes('fbcdn.net');
    }
    const expiresAtMs = parseInt(oeHex, 16) * 1000;
    if (Number.isNaN(expiresAtMs)) return false;
    return expiresAtMs > Date.now() + 30 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Self-healing Instagram Media Proxy:
 * Serves cached fresh CDN URLs immediately via 302 redirect, and transparently
 * refreshes expired Meta `cdninstagram.com` signed URLs (and 60-day tokens)
 * using the site's stored Instagram Graph token so published sites never show 403 broken images.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const siteId = searchParams.get('siteId') || '';
  const mediaId = searchParams.get('mediaId') || '';
  const handle = searchParams.get('handle') || '';
  const kind = searchParams.get('kind') === 'video' ? 'video' : 'image';

  if (!mediaId) {
    return NextResponse.json({ error: 'Missing mediaId' }, { status: 400 });
  }

  try {
    const site = siteId && siteId !== 'proj_default'
      ? await prisma.site.findUnique({ where: { id: siteId } })
      : handle
        ? await prisma.site.findFirst({
            where: { instagramHandle: { equals: handle.replace(/^@/, ''), mode: 'insensitive' } },
            orderBy: { updatedAt: 'desc' },
          })
        : null;

    if (!site) {
      return NextResponse.json({ error: 'Site not found for media asset' }, { status: 404 });
    }

    let bp: any = {};
    if (site.blueprintData) {
      try {
        bp = JSON.parse(site.blueprintData);
      } catch {}
    }

    const vault: any[] = Array.isArray(bp.mediaVault) ? bp.mediaVault : [];
    const assetIdx = vault.findIndex(
      (a) => a.igMediaId === mediaId || a.id === mediaId || String(a.id || '').endsWith(`-${mediaId}`)
    );
    const existingAsset = assetIdx >= 0 ? vault[assetIdx] : null;

    const candidateUrl = kind === 'video'
      ? (existingAsset?.rawVideoUrl || existingAsset?.url)
      : (existingAsset?.rawThumbUrl || existingAsset?.thumbnailUrl || existingAsset?.rawMediaUrl || existingAsset?.url);

    if (candidateUrl && !candidateUrl.startsWith('/api/media/ig') && isMetaCdnUrlFresh(candidateUrl)) {
      return NextResponse.redirect(candidateUrl, {
        status: 302,
        headers: { 'Cache-Control': 'public, max-age=1800, s-maxage=1800' },
      });
    }

    // URL expired or not cached — refresh via Instagram Graph API using stored long-lived token
    let token = site.instagramToken;
    if (!token || token === 'demo_token_authenticated') {
      if (candidateUrl && !candidateUrl.startsWith('/api/media/ig')) {
        return NextResponse.redirect(candidateUrl, { status: 302 });
      }
      return NextResponse.json({ error: 'Instagram token unavailable to refresh expired media' }, { status: 404 });
    }

    // Auto-refresh 60-day long-lived token if < 20 days remain
    const twentyDaysMs = 20 * 24 * 60 * 60 * 1000;
    if (site.instagramTokenExpiresAt && site.instagramTokenExpiresAt.getTime() - Date.now() < twentyDaysMs) {
      try {
        const refreshRes = await fetch(
          `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
        );
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.access_token) {
            token = refreshData.access_token;
            const expiresSec = Number(refreshData.expires_in) || 5184000;
            await prisma.site.update({
              where: { id: site.id },
              data: {
                instagramToken: token,
                instagramTokenExpiresAt: new Date(Date.now() + expiresSec * 1000),
              },
            });
          }
        }
      } catch (refreshErr) {
        console.warn('[IG Media Proxy] Token refresh warning:', refreshErr);
      }
    }

    // Fetch fresh media_url / thumbnail_url from Graph API
    const graphRes = await fetch(
      `https://graph.instagram.com/${encodeURIComponent(mediaId)}?fields=id,media_type,media_url,thumbnail_url&access_token=${encodeURIComponent(token)}`
    );

    if (!graphRes.ok) {
      if (candidateUrl && !candidateUrl.startsWith('/api/media/ig')) {
        return NextResponse.redirect(candidateUrl, { status: 302 });
      }
      return NextResponse.json({ error: 'Unable to refresh media from Instagram Graph API' }, { status: 502 });
    }

    const mediaNode = await graphRes.json();
    const freshMediaUrl: string = mediaNode.media_url || mediaNode.thumbnail_url || '';
    const freshThumbUrl: string = mediaNode.thumbnail_url || mediaNode.media_url || '';

    if (assetIdx >= 0 && (freshMediaUrl || freshThumbUrl)) {
      vault[assetIdx] = {
        ...vault[assetIdx],
        rawMediaUrl: freshMediaUrl,
        rawThumbUrl: freshThumbUrl,
      };
      bp.mediaVault = vault;
      await prisma.site.update({
        where: { id: site.id },
        data: { blueprintData: JSON.stringify(bp) },
      });
    }

    const targetRedirect = kind === 'video' ? freshMediaUrl : (freshThumbUrl || freshMediaUrl);
    if (!targetRedirect) {
      return NextResponse.json({ error: 'Empty media URL from Graph API' }, { status: 404 });
    }

    return NextResponse.redirect(targetRedirect, {
      status: 302,
      headers: { 'Cache-Control': 'public, max-age=1800, s-maxage=1800' },
    });
  } catch (err) {
    console.error('[IG Media Proxy Error]:', err);
    return NextResponse.json({ error: 'Internal media proxy error' }, { status: 500 });
  }
}
