import { describe, it, expect } from 'vitest';
import {
  normalizeWhatsAppPhone,
  formatEnquiryWhatsAppMessage,
  buildCustomerToVendorWhatsAppUrl,
  buildVendorReplyWhatsAppUrl,
} from '@/lib/enquiry-utils';

describe('Visitor Enquiry & WhatsApp Handoff Utilities', () => {
  it('normalizes local 11-digit Nigerian numbers and international numbers cleanly', () => {
    expect(normalizeWhatsAppPhone('0803 123 4567')).toBe('2348031234567');
    expect(normalizeWhatsAppPhone('+234 901 222 3333')).toBe('2349012223333');
    expect(normalizeWhatsAppPhone('+44 7700 900077')).toBe('447700900077');
  });

  it('builds a clean structured WhatsApp enquiry link with all entered client fields', () => {
    const url = buildCustomerToVendorWhatsAppUrl('08031234567', {
      businessName: 'Tolu Artistry',
      clientName: 'Amaka Obi',
      clientPhone: '08123456789',
      serviceName: 'Bridal Glam (From ₦150,000)',
      eventDate: '2026-12-19',
      location: 'Lekki Phase 1',
      notes: ' Bride + 3 bridesmaids, 6am start',
    });

    expect(url).toContain('https://wa.me/2348031234567?text=');
    const msg = formatEnquiryWhatsAppMessage({
      businessName: 'Tolu Artistry',
      clientName: 'Amaka Obi',
      serviceName: 'Bridal Glam',
      eventDate: '2026-12-19',
    });
    expect(msg).toContain('Amaka Obi');
    expect(msg).toContain('Bridal Glam');
    expect(msg).toContain('2026-12-19');
  });

  it('builds a 1-tap vendor reply WhatsApp link from the dashboard inbox', () => {
    const reply = buildVendorReplyWhatsAppUrl(
      '08123456789',
      'Tolu Artistry',
      'Amaka Obi',
      'Bridal Glam',
      '2026-12-19'
    );
    expect(reply).toContain('https://wa.me/2348123456789?text=');
    expect(decodeURIComponent(reply!)).toContain('Amaka Obi');
  });
});
