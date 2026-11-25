import { NextResponse } from 'next/server';
import { resolve4, resolveCname } from 'dns/promises';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const VERCEL_APEX_IP = '76.76.21.21';
const VERCEL_CNAME = 'cname.vercel-dns.com';

function normalizeCustomDomain(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');
}

async function resolveSessionUser() {
  const session = await auth();
  if (!session?.user?.email && !session?.user?.id) return null;
  return session.user.id
    ? prisma.user.findUnique({ where: { id: session.user.id } })
    : prisma.user.findUnique({ where: { email: session.user.email! } });
}

/**
 * POST /api/domains
 * Connects a Pro user's custom domain (e.g., `toluglam.com` or `toluglam.com.ng`),
 * registers it on the Vercel project via Vercel Domains API (automatic Let's Encrypt SSL),
 * and returns DNS records.
 */
export async function POST(req: Request) {
  try {
    const user = await resolveSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId, customDomain: rawDomain } = await req.json();
    const cleanDomain = normalizeCustomDomain(rawDomain || '');

    if (!cleanDomain || !cleanDomain.includes('.') || cleanDomain.endsWith('.cuzmify.com') || cleanDomain.endsWith('.vercel.app')) {
      return NextResponse.json(
        { error: 'Enter a valid custom domain such as yourbrand.com or yourbrand.com.ng' },
        { status: 400 }
      );
    }

    const site = siteId && siteId !== 'proj_default'
      ? await prisma.site.findUnique({ where: { id: siteId } })
      : await prisma.site.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });

    if (!site || site.userId !== user.id) {
      return NextResponse.json({ error: 'Save your website first before connecting a domain.' }, { status: 400 });
    }

    if (site.plan !== 'pro' && user.plan !== 'pro') {
      return NextResponse.json(
        { error: 'Upgrade to Cuzmify Pro to connect a custom .com or .com.ng domain.', requiresPro: true },
        { status: 402 }
      );
    }

    // Check if another site already claimed this custom domain
    const conflict = await prisma.site.findUnique({ where: { customDomain: cleanDomain } });
    if (conflict && conflict.id !== site.id) {
      return NextResponse.json({ error: 'This domain is already connected to another site.' }, { status: 409 });
    }

    // Register apex + www on Vercel Domains API when VERCEL_AUTH_TOKEN & VERCEL_PROJECT_ID are configured
    const vercelToken = process.env.VERCEL_AUTH_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;
    let vercelProvisioned = false;

    if (vercelToken && vercelProjectId) {
      const teamQuery = vercelTeamId ? `?teamId=${encodeURIComponent(vercelTeamId)}` : '';
      for (const dom of [cleanDomain, `www.${cleanDomain}`]) {
        try {
          const vRes = await fetch(
            `https://api.vercel.com/v10/projects/${encodeURIComponent(vercelProjectId)}/domains${teamQuery}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${vercelToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name: dom }),
            }
          );
          if (vRes.ok || vRes.status === 409) {
            vercelProvisioned = true;
          }
        } catch (vErr) {
          console.warn('[Vercel Domains API Warning]:', vErr);
        }
      }
    }

    const updated = await prisma.site.update({
      where: { id: site.id },
      data: {
        customDomain: cleanDomain,
        domain: cleanDomain,
        domainVerified: false,
      },
    });

    return NextResponse.json({
      success: true,
      customDomain: updated.customDomain,
      vercelProvisioned,
      dnsRecords: [
        { type: 'A', host: '@', value: VERCEL_APEX_IP, note: 'Root domain' },
        { type: 'CNAME', host: 'www', value: VERCEL_CNAME, note: 'www subdomain' },
      ],
    });
  } catch (err: any) {
    console.error('[POST /api/domains Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to connect custom domain' }, { status: 500 });
  }
}

/**
 * GET /api/domains?siteId=...
 * Checks live DNS propagation (`A` record -> `76.76.21.21` or `CNAME`) + Vercel verification status.
 */
export async function GET(req: Request) {
  try {
    const user = await resolveSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId') || '';

    const site = siteId && siteId !== 'proj_default'
      ? await prisma.site.findUnique({ where: { id: siteId } })
      : await prisma.site.findFirst({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });

    if (!site || site.userId !== user.id) {
      return NextResponse.json({ plan: user.plan || 'free', customDomain: null, verified: false });
    }

    const effectivePlan = site.plan === 'pro' || user.plan === 'pro' ? 'pro' : 'free';
    if (!site.customDomain) {
      return NextResponse.json({ siteId: site.id, plan: effectivePlan, customDomain: null, verified: false });
    }

    let verified = site.domainVerified;

    // Live DNS check (works with or without Vercel API token)
    try {
      const ips = await resolve4(site.customDomain).catch(() => [] as string[]);
      const wwwCnames = await resolveCname(`www.${site.customDomain}`).catch(() => [] as string[]);
      if (
        ips.includes(VERCEL_APEX_IP) ||
        wwwCnames.some((c) => c.toLowerCase().includes('vercel-dns.com'))
      ) {
        verified = true;
      }
    } catch {}

    // Also check Vercel Domain Config API if configured
    const vercelToken = process.env.VERCEL_AUTH_TOKEN;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;
    if (vercelToken && !verified) {
      try {
        const teamQuery = vercelTeamId ? `?teamId=${encodeURIComponent(vercelTeamId)}` : '';
        const cfgRes = await fetch(
          `https://api.vercel.com/v6/domains/${encodeURIComponent(site.customDomain)}/config${teamQuery}`,
          { headers: { Authorization: `Bearer ${vercelToken}` } }
        );
        if (cfgRes.ok) {
          const cfg = await cfgRes.json();
          if (cfg && cfg.misconfigured === false) {
            verified = true;
          }
        }
      } catch {}
    }

    if (verified && !site.domainVerified) {
      await prisma.site.update({
        where: { id: site.id },
        data: { domainVerified: true },
      });
    }

    return NextResponse.json({
      siteId: site.id,
      plan: effectivePlan,
      customDomain: site.customDomain,
      verified,
      dnsRecords: [
        { type: 'A', host: '@', value: VERCEL_APEX_IP },
        { type: 'CNAME', host: 'www', value: VERCEL_CNAME },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Domain verification error' }, { status: 500 });
  }
}
