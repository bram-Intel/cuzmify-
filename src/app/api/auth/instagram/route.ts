import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const currency = searchParams.get('currency') || 'NGN';
  const category = searchParams.get('category') || 'Service Business';
  const name = searchParams.get('name') || '';
  const siteId = searchParams.get('siteId') || '';
  const handle = searchParams.get('handle') || '';

  const origin = new URL(req.url).origin;
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${origin}/api/auth/instagram/callback`;

  // Never inject fake simulated data if credentials are missing; fail transparently
  if (!clientId || clientId === 'your_instagram_client_id') {
    const fallbackPath = siteId ? `/studio?projectId=${encodeURIComponent(siteId)}&error=ig_not_configured` : '/onboarding?error=ig_not_configured';
    return NextResponse.redirect(new URL(fallbackPath, req.url).toString());
  }

  const state = Buffer.from(
    JSON.stringify({ currency, category, name, siteId, handle, timestamp: Date.now() })
  ).toString('base64');

  // Request ONLY instagram_business_basic (minimal required scope for Meta App Review)
  const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=instagram_business_basic&state=${state}`;

  return NextResponse.redirect(authUrl);
}
