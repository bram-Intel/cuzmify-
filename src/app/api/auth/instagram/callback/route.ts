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

  let stateData: { currency?: CurrencyCode; category?: string; name?: string } = {};
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
    };
  }

  const origin = new URL(req.url).origin;
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${origin}/api/auth/instagram/callback`;

  // Sandbox / Demo Mode Fallback
  if (code === 'sandbox_demo_code' || !clientId || !clientSecret) {
    const handle = stateData.name ? stateData.name.toLowerCase().replace(/\s+/g, '_') : 'glory_artistry';
    const importResult = await InstagramImporter.ingestProfile(handle, stateData.currency || 'USD');

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

    // Format business name and suggestions
    const formattedName = stateData.name || InstagramImporter.formatBusinessName(handle);

    const redirectUrl = new URL('/onboarding', req.url);
    redirectUrl.searchParams.set('step', '2');
    redirectUrl.searchParams.set('instagram', handle);
    redirectUrl.searchParams.set('name', formattedName);
    redirectUrl.searchParams.set('category', stateData.category || 'Makeup Artists & Beauty');
    redirectUrl.searchParams.set('currency', stateData.currency || 'USD');
    redirectUrl.searchParams.set('mediaCount', String(realMediaVault.length));

    const response = NextResponse.redirect(redirectUrl.toString());
    if (realMediaVault.length > 0) {
      response.cookies.set('cuzmify_ig_media', JSON.stringify(realMediaVault), {
        path: '/',
        maxAge: 3600,
        sameSite: 'lax',
      });
    }
    return response;
  } catch (error) {
    console.error('[Instagram OAuth Callback Exception]:', error);
    const redirectUrl = new URL('/onboarding', req.url);
    redirectUrl.searchParams.set('error', 'instagram_import_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }
}
