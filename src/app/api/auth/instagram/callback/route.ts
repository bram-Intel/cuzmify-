import { NextResponse } from 'next/server';
import { InstagramImporter } from '@/services/importer/instagram-importer';
import { CurrencyCode, type MediaVaultAsset } from '@/core/blueprint-schema';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorReason = searchParams.get('error_reason');
  const errorDescription = searchParams.get('error_description');

  if (error || !code) {
    console.error('[Instagram OAuth Error]:', error, errorReason, errorDescription);
    const redirectUrl = new URL('/onboarding', req.url);
    redirectUrl.searchParams.set('error', 'instagram_auth_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }

  let stateData: { currency?: CurrencyCode; category?: string; name?: string; siteId?: string; handle?: string } = {};
  const rawState = searchParams.get('state');
  if (rawState) {
    try {
      stateData = JSON.parse(Buffer.from(rawState, 'base64').toString('utf-8'));
    } catch {}
  } else {
    stateData = {
      currency: (searchParams.get('currency') as CurrencyCode) || 'USD',
      category: searchParams.get('category') || 'Makeup Artists & Beauty',
      name: searchParams.get('name') || '',
      siteId: searchParams.get('siteId') || undefined,
      handle: searchParams.get('handle') || undefined,
    };
  }

  const origin = new URL(req.url).origin;
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${origin}/api/auth/instagram/callback`;

  // Sandbox / Demo Mode Fallback
  if (code === 'sandbox_demo_code' || !clientId || !clientSecret) {
    const handle = stateData.handle || (stateData.name ? stateData.name.toLowerCase().replace(/\s+/g, '_') : 'glory_artistry');
    const importResult = await InstagramImporter.ingestProfile(handle, stateData.currency || 'USD');

    if (stateData.siteId) {
      try {
        const { prisma } = await import('@/lib/prisma');
        const existingSite = await prisma.site.findUnique({ where: { id: stateData.siteId } });
        if (existingSite) {
          let bp: any = {};
          if (existingSite.blueprintData) {
            try { bp = JSON.parse(existingSite.blueprintData); } catch {}
          }
          bp.mediaVault = importResult.mediaVault;
          await prisma.site.update({
            where: { id: stateData.siteId },
            data: {
              instagramHandle: handle,
              instagramToken: 'demo_token_authenticated',
              blueprintData: JSON.stringify(bp),
              updatedAt: new Date(),
            },
          });
        }
      } catch (err) {
        console.warn('[Demo Instagram Sync DB Error]:', err);
      }
      return NextResponse.redirect(new URL(`/studio?projectId=${stateData.siteId}&synced=instagram`, req.url).toString());
    }

    const redirectUrl = new URL('/onboarding', req.url);
    redirectUrl.searchParams.set('step', '3');
    redirectUrl.searchParams.set('instagram', importResult.handle);
    redirectUrl.searchParams.set('name', importResult.businessName);
    redirectUrl.searchParams.set('category', stateData.category || importResult.category);
    redirectUrl.searchParams.set('currency', stateData.currency || 'USD');
    redirectUrl.searchParams.set('template', importResult.suggestedTemplate);
    return NextResponse.redirect(redirectUrl.toString());
  }

  try {
    // 1. Exchange authorization code for access token with Instagram API
    let accessToken = '';
    const tokenFormData = new FormData();
    tokenFormData.append('client_id', clientId);
    tokenFormData.append('client_secret', clientSecret);
    tokenFormData.append('grant_type', 'authorization_code');
    tokenFormData.append('redirect_uri', redirectUri);
    tokenFormData.append('code', code);

    const igRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: tokenFormData,
    });

    if (igRes.ok) {
      const igData = await igRes.json();
      accessToken = igData.access_token;
    } else {
      const fbTokenRes = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
      );
      if (fbTokenRes.ok) {
        const fbData = await fbTokenRes.json();
        accessToken = fbData.access_token;
      }
    }

    if (!accessToken) {
      throw new Error('Failed to exchange authorization code for access token with Meta API');
    }

    // 2. Fetch User Profile & Instagram Accounts
    let handle = 'instagram_creator';
    let realMediaVault: MediaVaultAsset[] = [];

    // Query connected Instagram Business accounts on Meta Graph
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account{id,username,profile_picture_url,media{id,caption,media_type,media_url,thumbnail_url,permalink,timestamp}}&access_token=${accessToken}`
    );

    if (accountsRes.ok) {
      const accountsData = await accountsRes.json();
      for (const page of accountsData.data || []) {
        const ig = page.instagram_business_account;
        if (ig) {
          if (ig.username) handle = ig.username;
          if (Array.isArray(ig.media?.data)) {
            realMediaVault = ig.media.data
              .map((m: any, idx: number) => ({
                id: `ig-live-${m.id || Date.now()}-${idx}`,
                url: m.media_url || m.thumbnail_url || '',
                name: m.caption ? m.caption.slice(0, 40) : `Instagram Post #${idx + 1}`,
                type: idx === 0 ? ('hero' as const) : ('gallery' as const),
                source: 'instagram' as const,
                caption: m.caption || `Post from @${handle}`,
                instagramPostUrl: m.permalink || `https://instagram.com/${handle}`,
                addedAt: m.timestamp || new Date().toISOString(),
              }))
              .filter((m: MediaVaultAsset) => Boolean(m.url));
            break;
          }
        }
      }
    }

    // Direct /me query fallback
    if (realMediaVault.length === 0) {
      const userRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.username) handle = userData.username;

        const mediaRes = await fetch(
          `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}&limit=12`
        );
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          realMediaVault = (mediaData.data || [])
            .map((m: any, idx: number) => ({
              id: `ig-live-${m.id || Date.now()}-${idx}`,
              url: m.media_url || m.thumbnail_url || '',
              name: m.caption ? m.caption.slice(0, 40) : `Instagram Post #${idx + 1}`,
              type: idx === 0 ? ('hero' as const) : ('gallery' as const),
              source: 'instagram' as const,
              caption: m.caption || `Post from @${handle}`,
              instagramPostUrl: m.permalink || `https://instagram.com/${handle}`,
              addedAt: m.timestamp || new Date().toISOString(),
            }))
            .filter((m: MediaVaultAsset) => Boolean(m.url));
        }
      }
    }

    // If real posts could not be pulled from Graph API, guarantee non-empty vault with profile ingestion
    if (realMediaVault.length === 0) {
      const fallbackResult = await InstagramImporter.ingestProfile(handle, stateData.currency || 'USD');
      realMediaVault = fallbackResult.mediaVault || [];
    }

    // Cache extracted photos in memory for instant display
    if (realMediaVault.length > 0) {
      InstagramImporter.setCachedMedia(handle, realMediaVault);
    }

    // Format business name and suggestions
    const formattedName = stateData.name || InstagramImporter.formatBusinessName(handle);

    if (stateData.siteId) {
      let targetSiteId = stateData.siteId;
      try {
        const { prisma } = await import('@/lib/prisma');
        const { auth } = await import('@/auth');
        const session = await auth();
        let userId = session?.user?.id;
        if (!userId && session?.user?.email) {
          const u = await prisma.user.findUnique({ where: { email: session.user.email } });
          userId = u?.id;
        }

        let targetSite = stateData.siteId && stateData.siteId !== 'proj_default'
          ? await prisma.site.findUnique({ where: { id: stateData.siteId } })
          : null;

        if (!targetSite && userId) {
          targetSite = await prisma.site.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
          });
        }

        if (!targetSite) {
          const initialSubdomain = `${handle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'studio'}-${Date.now().toString().slice(-4)}`;
          targetSite = await prisma.site.create({
            data: {
              id: stateData.siteId && stateData.siteId !== 'proj_default' ? stateData.siteId : undefined,
              userId: userId || undefined,
              name: formattedName || 'My Business Studio',
              subdomain: initialSubdomain,
              domain: `${initialSubdomain}.cuzmify.com`,
              status: 'draft',
              liveUrl: `/s/${initialSubdomain}`,
              instagramHandle: handle,
              instagramToken: accessToken,
            },
          });
        }

        if (targetSite) {
          targetSiteId = targetSite.id;
          let bp: any = {};
          if (targetSite.blueprintData) {
            try { bp = JSON.parse(targetSite.blueprintData); } catch {}
          }
          if (realMediaVault.length > 0) {
            bp.mediaVault = realMediaVault;
          }
          if (!bp.profile) bp.profile = {};
          bp.profile.instagram = handle;
          bp.profile.instagramHandle = handle;

          await prisma.site.update({
            where: { id: targetSite.id },
            data: {
              instagramHandle: handle,
              instagramToken: accessToken,
              blueprintData: JSON.stringify(bp),
              updatedAt: new Date(),
            },
          });
        }
      } catch (err) {
        console.warn('[Real Instagram Sync DB Error]:', err);
      }

      const redirectUrl = new URL(
        `/studio?projectId=${encodeURIComponent(targetSiteId || 'proj_default')}&instagram=${encodeURIComponent(handle)}&synced=instagram`,
        req.url
      );
      const response = NextResponse.redirect(redirectUrl.toString());
      if (realMediaVault.length > 0) {
        response.cookies.set('cuzmify_ig_media', JSON.stringify(realMediaVault), {
          path: '/',
          maxAge: 3600,
          sameSite: 'lax',
        });
        response.cookies.set('cuzmify_ig_handle', handle, {
          path: '/',
          maxAge: 3600,
          sameSite: 'lax',
        });
      }
      return response;
    }

    const redirectUrl = new URL('/onboarding', req.url);
    redirectUrl.searchParams.set('step', '2');
    redirectUrl.searchParams.set('instagram', handle);
    redirectUrl.searchParams.set('name', formattedName);
    redirectUrl.searchParams.set('category', stateData.category || 'Makeup Artists & Beauty');
    redirectUrl.searchParams.set('currency', stateData.currency || 'USD');
    redirectUrl.searchParams.set('mediaCount', String(realMediaVault.length));

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[Instagram OAuth Callback Exception]:', error);
    const redirectUrl = new URL('/onboarding', req.url);
    redirectUrl.searchParams.set('error', 'instagram_import_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }
}
