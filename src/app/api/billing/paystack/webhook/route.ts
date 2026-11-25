import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPaystackWebhookSignature } from '@/lib/billing';

/**
 * Signed Paystack Webhook (`POST /api/billing/paystack/webhook`)
 * Verifies `x-paystack-signature` HMAC-SHA512 and upgrades the user/site to Pro asynchronously.
 */
export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Paystack not configured' }, { status: 400 });
  }

  const signature = req.headers.get('x-paystack-signature') || '';
  const rawBody = await req.text();

  if (!signature || !verifyPaystackWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    if (event?.event === 'charge.success' && event?.data?.reference) {
      const ref: string = event.data.reference;
      const meta = event.data.metadata || {};

      if (meta.siteId) {
        await prisma.site.update({
          where: { id: meta.siteId },
          data: { plan: 'pro' },
        });
      }
      if (meta.userId) {
        await prisma.user.update({
          where: { id: meta.userId },
          data: { plan: 'pro' },
        });
      }
      await prisma.paymentRecord.updateMany({
        where: { reference: ref },
        data: { status: 'success' },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Paystack Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
