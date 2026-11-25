import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export interface MetaSignedRequestPayload {
  user_id?: string;
  algorithm?: string;
  issued_at?: number;
  [key: string]: unknown;
}

function base64UrlDecodeToBuffer(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

/**
 * Verifies and decodes a Meta `signed_request` (`encodedSig.encodedPayload`)
 * using HMAC-SHA256 with the app's `INSTAGRAM_CLIENT_SECRET`.
 */
export function parseMetaSignedRequest(
  signedRequest: string,
  appSecret: string
): MetaSignedRequestPayload | null {
  if (!signedRequest || !appSecret || !signedRequest.includes('.')) {
    return null;
  }

  try {
    const [encodedSig, encodedPayload] = signedRequest.split('.', 2);
    if (!encodedSig || !encodedPayload) return null;

    const sig = base64UrlDecodeToBuffer(encodedSig);
    const expectedSig = createHmac('sha256', appSecret).update(encodedPayload).digest();

    if (sig.length !== expectedSig.length || !timingSafeEqual(sig, expectedSig)) {
      return null;
    }

    const decoded = JSON.parse(base64UrlDecodeToBuffer(encodedPayload).toString('utf8')) as MetaSignedRequestPayload;
    if (decoded.algorithm && String(decoded.algorithm).toUpperCase() !== 'HMAC-SHA256') {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function generateMetaConfirmationCode(seed?: string): string {
  const suffix = randomBytes(4).toString('hex').toUpperCase();
  const cleanSeed = (seed || 'IG').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'USER';
  return `CZM-DEL-${cleanSeed}-${suffix}`;
}
