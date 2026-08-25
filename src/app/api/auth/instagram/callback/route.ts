import { NextResponse } from 'next/server';
import { InstagramImporter } from '@/services/importer/instagram-importer';
import { CurrencyCode } from '@/core/blueprint-schema';

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

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/instagram/callback`;

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
    // 1. Exchange authorization code for short-lived access token
    const tokenFormData = new FormData();
    tokenFormData.append('client_id', clientId);
    tokenFormData.append('client_secret', clientSecret);
    tokenFormData.append('grant_type', 'authorization_code');
    tokenFormData.append('redirect_uri', redirectUri);
    tokenFormData.append('code', code);

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: tokenFormData,
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('[Instagram Token Exchange Failed]:', errBody);
      throw new Error('Failed to exchange Instagram authorization code');
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // 2. Fetch User Profile
    const userRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
    );
    const userData = userRes.ok ? await userRes.json() : { username: 'instagram_creator' };
    const handle = userData.username || 'instagram_creator';

    // 3. Fetch User Media (Photos & Videos)
    const mediaRes = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}&limit=12`
    );
    const mediaData = mediaRes.ok ? await mediaRes.json() : { data: [] };

    // Format business name and suggestions
    const formattedName = stateData.name || InstagramImporter.formatBusinessName(handle);

    const redirectUrl = new URL('/onboarding', req.url);
    redirectUrl.searchParams.set('step', '3');
    redirectUrl.searchParams.set('instagram', handle);
    redirectUrl.searchParams.set('name', formattedName);
    redirectUrl.searchParams.set('category', stateData.category || 'Makeup Artists & Beauty');
    redirectUrl.searchParams.set('currency', stateData.currency || 'USD');
    redirectUrl.searchParams.set('mediaCount', String(mediaData.data?.length || 0));

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[Instagram OAuth Callback Exception]:', error);
    const redirectUrl = new URL('/onboarding', req.url);
    redirectUrl.searchParams.set('error', 'instagram_import_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }
}
