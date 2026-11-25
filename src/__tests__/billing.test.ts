import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  generateSiteActivationCode,
  verifySiteActivationCode,
  verifyPaystackWebhookSignature,
} from '@/lib/billing';

describe('Pro Monetization & Activation Security', () => {
  it('generates and verifies deterministic per-site Pro activation codes', () => {
    const code = generateSiteActivationCode('site_abc123', 'test-secret');
    expect(code).toMatch(/^PRO-[A-F0-9]{8}$/);
    expect(verifySiteActivationCode('site_abc123', code, 'test-secret')).toBe(true);
    expect(verifySiteActivationCode('site_other', code, 'test-secret')).toBe(false);
    expect(verifySiteActivationCode('site_abc123', 'PRO-00000000', 'test-secret')).toBe(false);
  });

  it('verifies Paystack HMAC-SHA512 webhook signatures accurately', () => {
    const body = JSON.stringify({ event: 'charge.success', data: { reference: 'cz_123' } });
    const sig = createHmac('sha512', 'sk_test_secret').update(body).digest('hex');
    expect(verifyPaystackWebhookSignature(body, sig, 'sk_test_secret')).toBe(true);
    expect(verifyPaystackWebhookSignature(body, 'bad_signature', 'sk_test_secret')).toBe(false);
  });
});
