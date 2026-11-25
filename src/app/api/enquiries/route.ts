import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { buildCustomerToVendorWhatsAppUrl } from '@/lib/enquiry-utils';

async function resolveUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    return user?.id || null;
  }
  return null;
}

/**
 * Public POST: Records a visitor booking/enquiry from a live site (`/s/[domain]`)
 * and returns the structured WhatsApp deep link.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientName = String(body.clientName || '').trim();
    const clientPhone = String(body.clientPhone || '').trim();
    const serviceName = String(body.serviceName || '').trim();
    const eventDate = String(body.eventDate || '').trim();
    const location = String(body.location || '').trim();
    const notes = String(body.notes || '').trim();
    const siteId = String(body.siteId || '').trim();
    const domain = String(body.domain || '').trim().toLowerCase();

    if (!clientName) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }

    let site: any = null;
    try {
      if (siteId) {
        site = await prisma.site.findUnique({ where: { id: siteId } });
      }
      if (!site && domain) {
        site = await prisma.site.findFirst({
          where: {
            OR: [
              { subdomain: { equals: domain, mode: 'insensitive' } },
              { customDomain: { equals: domain, mode: 'insensitive' } },
              { id: domain },
            ],
          },
          orderBy: { updatedAt: 'desc' },
        });
      }
    } catch (dbLookupErr) {
      console.warn('[Enquiries] Site lookup warning:', dbLookupErr);
    }

    let savedEnquiryId: string | null = null;
    if (site?.id) {
      try {
        const created = await prisma.enquiry.create({
          data: {
            siteId: site.id,
            clientName,
            clientPhone: clientPhone || undefined,
            serviceName: serviceName || undefined,
            eventDate: eventDate || undefined,
            location: location || undefined,
            notes: notes || undefined,
            status: 'new',
          },
        });
        savedEnquiryId = created.id;
      } catch (saveErr) {
        console.warn('[Enquiries] Persist warning:', saveErr);
      }
    }

    let vendorWa = site?.whatsappPhone || body.fallbackWhatsapp || '';
    if (!vendorWa && site?.blueprintData) {
      try {
        const bp = JSON.parse(site.blueprintData);
        vendorWa = bp?.modules?.whatsapp?.phoneNumber || bp?.profile?.whatsapp || '';
      } catch {}
    }

    const businessName = site?.name || body.businessName || 'Studio';
    const whatsappUrl = buildCustomerToVendorWhatsAppUrl(vendorWa, {
      businessName,
      clientName,
      clientPhone,
      serviceName,
      eventDate,
      location,
      notes,
    });

    return NextResponse.json({
      success: true,
      enquiryId: savedEnquiryId,
      whatsappUrl,
    });
  } catch (err: any) {
    console.error('[POST /api/enquiries Error]:', err);
    return NextResponse.json({ error: 'Failed to submit enquiry' }, { status: 500 });
  }
}

/**
 * Authenticated GET: Lists enquiries across the signed-in vendor's sites.
 */
export async function GET() {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enquiries = await prisma.enquiry.findMany({
      where: { site: { userId } },
      include: { site: { select: { id: true, name: true, subdomain: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ enquiries });
  } catch (err: any) {
    return NextResponse.json({ enquiries: [], warning: err?.message });
  }
}

/**
 * Authenticated PATCH: Updates enquiry status (`new` | `contacted` | `booked` | `archived`).
 */
export async function PATCH(req: Request) {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { enquiryId, status } = await req.json();
    if (!enquiryId || !['new', 'contacted', 'booked', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const existing = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: { site: { select: { userId: true } } },
    });

    if (!existing || existing.site.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: { status },
    });

    return NextResponse.json({ success: true, enquiry: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update enquiry' }, { status: 500 });
  }
}
