import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const currency = searchParams.get('currency') || 'USD';
  const category = searchParams.get('category') || 'Makeup Artists & Beauty';
  const name = searchParams.get('name') || '';

  const origin = new URL(req.url).origin;
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || `${origin}/api/auth/instagram/callback`;

  // If credentials are not yet configured in .env, redirect to simulated sandbox callback with informative parameter
  if (!clientId || clientId === 'your_instagram_client_id') {
    const sandboxUrl = new URL('/api/auth/instagram/callback', req.url);
    sandboxUrl.searchParams.set('code', 'sandbox_demo_code');
    sandboxUrl.searchParams.set('currency', currency);
    sandboxUrl.searchParams.set('category', category);
    sandboxUrl.searchParams.set('name', name);
    return NextResponse.redirect(sandboxUrl.toString());
  }

  // State encodes user's onboarding preferences
  const state = Buffer.from(
    JSON.stringify({ currency, category, name, timestamp: Date.now() })
  ).toString('base64');

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=user_profile,user_media&response_type=code&state=${state}`;

  return NextResponse.redirect(authUrl);
}
