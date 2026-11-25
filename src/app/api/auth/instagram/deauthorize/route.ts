import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseMetaSignedRequest } from '@/lib/meta-compliance';

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
 * Meta / Instagram Deauthorize Callback (`POST /api/auth/instagram/deauthorize`).
 * Invoked by Meta when a creator removes Cuzmify in Instagram Apps & Websites settings.
 */
export async function POST(req: Request) {
  const signedRequest = await extractSignedRequest(req);
  const secret = process.env.INSTAGRAM_CLIENT_SECRET || '';

  const payload = parseMetaSignedRequest(signedRequest, secret);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or missing Meta signed_request' }, { status: 400 });
  }

  const igUserId = payload.user_id ? String(payload.user_id) : undefined;
  try {
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
    console.warn('[Meta Deauthorize Callback] Cleanup warning:', err);
  }

  return NextResponse.json({ success: true });
}
