import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { PRO_PRICING, verifySiteActivationCode } from '@/lib/billing';

async function resolveSessionUser() {
  const session = await auth();
  if (!session?.user?.email && !session?.user?.id) return null;
  const user = session.user.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : await prisma.user.findUnique({ where: { email: session.user.email! } });
  return user;
}

/**
 * POST /api/billing/upgrade
 * Mode A (`action: 'paystack'`): Initializes a Paystack checkout session when `PAYSTACK_SECRET_KEY` is configured.
 * Mode B (`action: 'code'`): Verifies a Founder Pro Activation Code (for bank-transfer / concierge upgrades) and unlocks Pro immediately.
 */
export async function POST(req: Request) {
  try {
    const user = await resolveSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    }

    const body = await req.json();
    const { siteId, cycle = 'annual', currency = 'NGN', action = 'paystack', activationCode = '' } = body;

    let site = siteId && siteId !== 'proj_default'
      ? await prisma.site.findUnique({ where: { id: siteId } })
      : await prisma.site.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });

    if (!site || site.userId !== user.id) {
      return NextResponse.json({ error: 'Save your website first before upgrading.' }, { status: 400 });
    }

    // Mode B: Instant Pro Activation Code (for Direct Bank Transfer / Concierge customers)
    if (action === 'code') {
      if (!activationCode || !verifySiteActivationCode(site.id, activationCode)) {
        return NextResponse.json(
          { error: 'Invalid activation code for this site. Check the code sent after transfer confirmation.' },
          { status: 400 }
        );
      }

      const ref = `manual_${site.id}_${Date.now()}`;
      await prisma.$transaction([
        prisma.site.update({ where: { id: site.id }, data: { plan: 'pro' } }),
        prisma.user.update({ where: { id: user.id }, data: { plan: 'pro' } }),
        prisma.paymentRecord.create({
          data: {
            userId: user.id,
            siteId: site.id,
            reference: ref,
            provider: 'manual_transfer',
            amountMinor: PRO_PRICING.NGN.annual.amountMinor,
            currency: 'NGN',
            plan: 'pro',
            status: 'success',
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        plan: 'pro',
        message: '🎉 Cuzmify Pro activated! Custom domain unlocked and footer badge removed.',
      });
    }

    // Mode A: Automated Paystack Checkout
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      return NextResponse.json(
        {
          paystackConfigured: false,
          siteId: site.id,
          message: 'Online card gateway is being finalized. Use Direct Bank Transfer / WhatsApp Activation below for instant Pro unlock.',
        },
        { status: 200 }
      );
    }

    const billingCurr = currency === 'USD' ? 'USD' : 'NGN';
    const billingCycle = cycle === 'monthly' ? 'monthly' : 'annual';
    const priceInfo = PRO_PRICING[billingCurr][billingCycle];
    const origin = new URL(req.url).origin;
    const reference = `cz_${site.id.slice(-8)}_${Date.now()}`;

    const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: priceInfo.amountMinor,
        currency: billingCurr,
        reference,
        callback_url: `${origin}/api/billing/upgrade?siteId=${encodeURIComponent(site.id)}`,
        metadata: {
          userId: user.id,
          siteId: site.id,
          cycle: billingCycle,
          plan: 'pro',
        },
      }),
    });

    const psData = await psRes.json();
    if (!psRes.ok || !psData?.data?.authorization_url) {
      return NextResponse.json(
        { error: psData?.message || 'Failed to initialize Paystack checkout.' },
        { status: 502 }
      );
    }

    await prisma.paymentRecord.create({
      data: {
        userId: user.id,
        siteId: site.id,
        reference,
        provider: 'paystack',
        amountMinor: priceInfo.amountMinor,
        currency: billingCurr,
        plan: 'pro',
        status: 'pending',
      },
    });

    return NextResponse.json({
      paystackConfigured: true,
      authorizationUrl: psData.data.authorization_url,
      reference,
    });
  } catch (err: any) {
    console.error('[POST /api/billing/upgrade Error]:', err);
    return NextResponse.json({ error: err?.message || 'Billing error' }, { status: 500 });
  }
}

/**
 * GET /api/billing/upgrade?reference=...&siteId=...
 * Paystack redirect callback verification: verifies payment with Paystack API and unlocks Pro.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';
  const siteId = searchParams.get('siteId') || '';
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

  if (!reference || !paystackSecret) {
    return NextResponse.redirect(new URL(`/studio?projectId=${encodeURIComponent(siteId || 'proj_default')}`, req.url));
  }

  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${paystackSecret}` },
    });
    const verifyData = await verifyRes.json();

    if (verifyRes.ok && verifyData?.data?.status === 'success') {
      const meta = verifyData.data.metadata || {};
      const resolvedSiteId = meta.siteId || siteId;
      const resolvedUserId = meta.userId;

      if (resolvedSiteId) {
        await prisma.site.update({
          where: { id: resolvedSiteId },
          data: { plan: 'pro' },
        });
      }
      if (resolvedUserId) {
        await prisma.user.update({
          where: { id: resolvedUserId },
          data: { plan: 'pro' },
        });
      }
      await prisma.paymentRecord.updateMany({
        where: { reference },
        data: { status: 'success' },
      });

      return NextResponse.redirect(
        new URL(`/studio?projectId=${encodeURIComponent(resolvedSiteId || 'proj_default')}&upgraded=pro`, req.url)
      );
    }
  } catch (err) {
    console.error('[Paystack Verify Callback Error]:', err);
  }

  return NextResponse.redirect(new URL(`/studio?projectId=${encodeURIComponent(siteId || 'proj_default')}`, req.url));
}
