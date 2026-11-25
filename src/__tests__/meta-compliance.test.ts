import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { generateMetaConfirmationCode, parseMetaSignedRequest } from '@/lib/meta-compliance';

function encodeBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

describe('Meta signed_request compliance verification', () => {
  const secret = 'test-ig-client-secret';

  it('decodes a valid HMAC-SHA256 signed_request from Meta', () => {
    const payload = { user_id: '178414000001234', algorithm: 'HMAC-SHA256', issued_at: 1700000000 };
    const encodedPayload = encodeBase64Url(JSON.stringify(payload));
    const sig = createHmac('sha256', secret).update(encodedPayload).digest();
    const signedRequest = `${encodeBase64Url(sig)}.${encodedPayload}`;

    const decoded = parseMetaSignedRequest(signedRequest, secret);
    expect(decoded?.user_id).toBe('178414000001234');
  });

  it('rejects tampered or wrong-secret signed_request payloads', () => {
    const encodedPayload = encodeBase64Url(JSON.stringify({ user_id: '999', algorithm: 'HMAC-SHA256' }));
    const badSig = createHmac('sha256', 'wrong-secret').update(encodedPayload).digest();
    const signedRequest = `${encodeBase64Url(badSig)}.${encodedPayload}`;

    expect(parseMetaSignedRequest(signedRequest, secret)).toBeNull();
    expect(parseMetaSignedRequest('malformed', secret)).toBeNull();
  });

  it('generates readable confirmation codes for data deletion receipts', () => {
    const code = generateMetaConfirmationCode('12345678');
    expect(code).toMatch(/^CZM-DEL-5678-[A-F0-9]{8}$/);
  });
});
