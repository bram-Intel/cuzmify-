export interface EnquiryPayload {
  businessName: string;
  clientName: string;
  clientPhone?: string;
  serviceName?: string;
  eventDate?: string;
  location?: string;
  notes?: string;
}

/**
 * Normalizes local Nigerian (`0803...` -> `234803...`) and international phone numbers
 * for `wa.me` deep links.
 */
export function normalizeWhatsAppPhone(raw?: string | null, defaultCountryPrefix = '234'): string {
  if (!raw) return '';
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0') && digits.length === 11) {
    return `${defaultCountryPrefix}${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Formats a clean, structured client booking/enquiry message for WhatsApp.
 */
export function formatEnquiryWhatsAppMessage(payload: EnquiryPayload): string {
  const lines: string[] = [
    `Hello ${payload.businessName || 'there'}!`,
    `I would like to make an enquiry:`,
    `• Name: ${payload.clientName.trim()}`,
  ];

  if (payload.clientPhone?.trim()) {
    lines.push(`• Phone: ${payload.clientPhone.trim()}`);
  }
  if (payload.serviceName?.trim()) {
    lines.push(`• Service: ${payload.serviceName.trim()}`);
  }
  if (payload.eventDate?.trim()) {
    lines.push(`• Date: ${payload.eventDate.trim()}`);
  }
  if (payload.location?.trim()) {
    lines.push(`• Location: ${payload.location.trim()}`);
  }
  if (payload.notes?.trim()) {
    lines.push(`• Details: ${payload.notes.trim()}`);
  }

  return lines.join('\n');
}

export function buildCustomerToVendorWhatsAppUrl(vendorPhone: string, payload: EnquiryPayload): string | null {
  const normalized = normalizeWhatsAppPhone(vendorPhone);
  if (!normalized) return null;
  const text = formatEnquiryWhatsAppMessage(payload);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function buildVendorReplyWhatsAppUrl(
  clientPhone: string,
  businessName: string,
  clientName: string,
  serviceName?: string | null,
  eventDate?: string | null
): string | null {
  const normalized = normalizeWhatsAppPhone(clientPhone);
  if (!normalized) return null;
  const contextPart = [
    serviceName ? `for *${serviceName}*` : '',
    eventDate ? `on *${eventDate}*` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const msg = `Hi ${clientName}, this is ${businessName}! Thanks for your enquiry ${contextPart}. Let's confirm the details.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(msg.replace(/\s+/g, ' ').trim())}`;
}
