import { createHmac, timingSafeEqual } from 'node:crypto';

export const PRO_PRICING = {
  NGN: {
    monthly: { amountMajor: 4000, amountMinor: 400000, label: '₦4,000 / month' },
    annual: { amountMajor: 30000, amountMinor: 3000000, label: '₦30,000 / year (Save 37%)' },
  },
  USD: {
    monthly: { amountMajor: 9, amountMinor: 900, label: '$9 / month' },
    annual: { amountMajor: 69, amountMinor: 6900, label: '$69 / year (Save 36%)' },
  },
} as const;

export const FREE_PLAN_SERVICE_LIMIT = 4;

/**
 * Generates a deterministic 8-character uppercase Pro Activation Code for a specific `siteId`
 * signed with `FOUNDER_ADMIN_SECRET` (or `NEXTAUTH_SECRET`).
 * Allows the founder to activate Pro for bank-transfer customers in 5 seconds before Paystack keys are added.
 */
export function generateSiteActivationCode(siteId: string, secret?: string): string {
  const signingSecret =
    secret || process.env.FOUNDER_ADMIN_SECRET || process.env.NEXTAUTH_SECRET || 'cuzmify-founder-signing-key';
  const digest = createHmac('sha256', signingSecret)
    .update(`cuzmify-pro:${siteId.trim()}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  return `PRO-${digest}`;
}

export function verifySiteActivationCode(siteId: string, providedCode: string, secret?: string): boolean {
  const clean = providedCode.trim().toUpperCase();
  // Also support static master/promo codes in PRO_ACTIVATION_CODES="CODE1,CODE2"
  const envCodes = (process.env.PRO_ACTIVATION_CODES || '')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  if (envCodes.includes(clean)) return true;

  const expected = generateSiteActivationCode(siteId, secret);
  try {
    const a = Buffer.from(clean);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyPaystackWebhookSignature(rawBody: string, signatureHeader: string, secretKey: string): boolean {
  try {
    const hash = createHmac('sha512', secretKey).update(rawBody).digest('hex');
    const a = Buffer.from(hash);
    const b = Buffer.from(signatureHeader);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
