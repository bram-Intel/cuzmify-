import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMetaConfirmationCode, parseMetaSignedRequest } from '@/lib/meta-compliance';

async function extractSignedRequest(req: Request): Promise<string> {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const json = await req.json().catch(() => ({}));
    return String(json.signed_request || '');
  }
  const raw = await req.text().catch(() => '');
  const params = new URLSearchParams(raw);
  return params.get('signed_request') || '';
}

/**
 * Meta / Instagram Data Deletion Request Callback (`POST /api/auth/instagram/data-deletion`).
 * Configured inside Meta Developer Portal -> App Settings / Instagram API -> Data Deletion Callback URL.
 */
export async function POST(req: Request) {
  const signedRequest = await extractSignedRequest(req);
  const secret = process.env.INSTAGRAM_CLIENT_SECRET || '';
  const origin = new URL(req.url).origin;

  const payload = parseMetaSignedRequest(signedRequest, secret);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or missing Meta signed_request' }, { status: 400 });
  }

  const igUserId = payload.user_id ? String(payload.user_id) : undefined;
  const confirmationCode = generateMetaConfirmationCode(igUserId);

  try {
    // Clear stored Instagram tokens and personal IG sync handles if matched cleanly
    if (igUserId) {
      await prisma.site.updateMany({
        where: { instagramHandle: igUserId },
        data: {
          instagramToken: null,
          instagramTokenExpiresAt: null,
        },
      });
    }
  } catch (err) {
    console.warn('[Meta Data Deletion Callback] Cleanup warning:', err);
  }

  const statusUrl = `${origin}/data-deletion?code=${encodeURIComponent(confirmationCode)}`;

  return NextResponse.json({
    url: statusUrl,
    confirmation_code: confirmationCode,
  });
}

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/data-deletion`);
}
