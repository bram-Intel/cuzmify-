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
      currency: (searchParams.get('currency') as CurrencyCode) || 'NGN',
      category: searchParams.get('category') || 'Service Business',
      name: searchParams.get('name') || '',
      siteId: searchParams.get('siteId') || undefined,
      handle: searchParams.get('handle') || undefined,
    };
  }

  const origin = new URL(req.url).origin;
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${origin}/api/auth/instagram/callback`;

  if (!clientId || !clientSecret) {
    const redirectUrl = new URL('/onboarding?error=ig_not_configured', req.url);
    return NextResponse.redirect(redirectUrl.toString());
  }

  try {
    // 1. Exchange authorization code for short-lived access token
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

    // 2. Exchange short-lived token (1h) for a 60-day Long-Lived Instagram Token
    let tokenExpiresAt: Date = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    try {
      const llRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(clientSecret)}&access_token=${encodeURIComponent(accessToken)}`
      );
      if (llRes.ok) {
        const llData = await llRes.json();
        if (llData.access_token) {
          accessToken = llData.access_token;
          const expiresSec = Number(llData.expires_in) || 5184000; // default 60 days
          tokenExpiresAt = new Date(Date.now() + expiresSec * 1000);
        }
      }
    } catch (llErr) {
      console.warn('[Instagram Long-Lived Token Exchange Warning]:', llErr);
    }

    // 3. Fetch real profile & media from Meta / Instagram Graph API
    let handle = stateData.handle ? InstagramImporter.cleanHandle(stateData.handle) : '';
    let realMediaVault: MediaVaultAsset[] = [];

    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=name,instagram_business_account{id,username,profile_picture_url,media{id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}}}&access_token=${accessToken}`
    );

    if (accountsRes.ok) {
      const accountsData = await accountsRes.json();
      for (const page of accountsData.data || []) {
        const ig = page.instagram_business_account;
        if (ig) {
          if (ig.username) handle = ig.username;
          if (Array.isArray(ig.media?.data)) {
            realMediaVault = InstagramImporter.parseInstagramGraphMedia(ig.media.data, handle || 'creator');
            break;
          }
        }
      }
    }

    if (realMediaVault.length === 0) {
      const userRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.username) handle = userData.username;

        const mediaRes = await fetch(
          `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url,thumbnail_url}&access_token=${accessToken}&limit=30`
        );
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          realMediaVault = InstagramImporter.parseInstagramGraphMedia(mediaData.data || [], handle || 'creator');
        }
      }
    }

    // Zero fake fallback: if user genuinely has 0 posts, realMediaVault stays []
    const formattedName = stateData.name || (handle ? InstagramImporter.formatBusinessName(handle) : 'My Studio');

    // Persist token + real media to the user's Site record if logged in or siteId passed
    const { prisma } = await import('@/lib/prisma');
    const { auth } = await import('@/auth');
    const session = await auth();
    let userId = session?.user?.id;
    if (!userId && session?.user?.email) {
      const u = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = u?.id;
    }

    let resolvedSiteId = stateData.siteId;

    if (stateData.siteId || userId) {
      try {
        let targetSite = stateData.siteId && stateData.siteId !== 'proj_default'
          ? await prisma.site.findUnique({ where: { id: stateData.siteId } })
          : null;

        if (targetSite && userId && targetSite.userId !== userId) {
          targetSite = null; // Prevent cross-tenant site write
        }

        if (!targetSite && userId) {
          targetSite = await prisma.site.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
          });
        }

        if (!targetSite && userId) {
          const baseSub = (handle || formattedName).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'studio';
          const initialSubdomain = `${baseSub}-${Date.now().toString().slice(-4)}`;
          targetSite = await prisma.site.create({
            data: {
              userId,
              name: formattedName,
              subdomain: initialSubdomain,
              domain: `${initialSubdomain}.cuzmify.com`,
              status: 'draft',
              liveUrl: `/s/${initialSubdomain}`,
              instagramHandle: handle || undefined,
              instagramToken: accessToken,
              instagramTokenExpiresAt: tokenExpiresAt,
              currency: stateData.currency || 'NGN',
              category: stateData.category || 'Service Business',
            },
          });
        }

        if (targetSite) {
          resolvedSiteId = targetSite.id;
          realMediaVault = InstagramImporter.bindSiteIdToVault(realMediaVault, targetSite.id, handle || 'creator');

          let bp: any = {};
          if (targetSite.blueprintData) {
            try {
              bp = JSON.parse(targetSite.blueprintData);
            } catch {}
          }
          bp.mediaVault = realMediaVault;
          if (!bp.profile) bp.profile = {};
          if (handle) {
            bp.profile.instagram = handle;
            bp.profile.instagramHandle = handle;
          }

          await prisma.site.update({
            where: { id: targetSite.id },
            data: {
              instagramHandle: handle || targetSite.instagramHandle,
              instagramToken: accessToken,
              instagramTokenExpiresAt: tokenExpiresAt,
              blueprintData: JSON.stringify(bp),
              updatedAt: new Date(),
            },
          });
        }
      } catch (err) {
        console.warn('[Real Instagram Sync DB Error]:', err);
      }
    }

    if (handle && realMediaVault.length > 0) {
      InstagramImporter.setCachedMedia(handle, realMediaVault);
    }

    if (stateData.siteId) {
      const redirectUrl = new URL(
        `/studio?projectId=${encodeURIComponent(resolvedSiteId || 'proj_default')}&instagram=${encodeURIComponent(handle)}&synced=instagram`,
        req.url
      );
      const response = NextResponse.redirect(redirectUrl.toString());
      if (realMediaVault.length > 0) {
        // Store compact asset list in short-lived hydration cookie (without duplicate raw URLs to stay <4KB cookie limit)
        const compactMedia = realMediaVault.slice(0, 12).map(({ rawMediaUrl: _rm, rawThumbUrl: _rt, ...rest }) => rest);
        response.cookies.set('cuzmify_ig_media', JSON.stringify(compactMedia), {
          path: '/',
          maxAge: 3600,
          sameSite: 'lax',
        });
      }
      if (handle) {
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
    if (handle) redirectUrl.searchParams.set('instagram', handle);
    if (resolvedSiteId) redirectUrl.searchParams.set('siteId', resolvedSiteId);
    redirectUrl.searchParams.set('name', formattedName);
    redirectUrl.searchParams.set('category', stateData.category || 'Service Business');
    redirectUrl.searchParams.set('currency', stateData.currency || 'NGN');
    redirectUrl.searchParams.set('mediaCount', String(realMediaVault.length));

    const onboardingResponse = NextResponse.redirect(redirectUrl.toString());
    if (realMediaVault.length > 0) {
      const compactMedia = realMediaVault.slice(0, 12).map(({ rawMediaUrl: _rm, rawThumbUrl: _rt, ...rest }) => rest);
      onboardingResponse.cookies.set('cuzmify_ig_media', JSON.stringify(compactMedia), {
        path: '/',
        maxAge: 3600,
        sameSite: 'lax',
      });
    }
    if (handle) {
      onboardingResponse.cookies.set('cuzmify_ig_handle', handle, {
        path: '/',
        maxAge: 3600,
        sameSite: 'lax',
      });
    }
    if (accessToken) {
      onboardingResponse.cookies.set(
        'cuzmify_ig_token',
        JSON.stringify({ accessToken, expiresAt: tokenExpiresAt.toISOString(), handle }),
        {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 3600,
        }
      );
    }

    return onboardingResponse;
  } catch (err) {
    console.error('[Instagram OAuth Callback Exception]:', err);
    const redirectUrl = new URL('/onboarding', req.url);
    redirectUrl.searchParams.set('error', 'instagram_import_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }
}
