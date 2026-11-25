'use client';

import { useEffect } from 'react';
import { buildCustomerToVendorWhatsAppUrl } from '@/lib/enquiry-utils';

/**
 * Lightweight (<2KB) delegated client runtime mounted on live published sites (`/s/[domain]`).
 * 1. Pre-selects a service in the booking form when a visitor taps any service CTA (`[data-select-service]`).
 * 2. Intercepts `<form data-cuzmify-enquiry="true">` (and legacy `#booking` forms), logs the lead to
 *    PostgreSQL via `/api/enquiries`, and opens WhatsApp with the structured booking brief.
 */
export function PublicEnquiryRuntime({
  siteId,
  domain,
  businessName,
  whatsappPhone,
}: {
  siteId: string;
  domain?: string;
  businessName: string;
  whatsappPhone?: string | null;
}) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.('[data-select-service]') as HTMLElement | null;
      if (!target) return;
      const serviceVal = target.getAttribute('data-select-service');
      if (!serviceVal) return;

      const selectEl = document.querySelector<HTMLSelectElement>(
        'form[data-cuzmify-enquiry="true"] select[name="serviceName"], section#booking select'
      );
      if (selectEl) {
        const match = Array.from(selectEl.options).find(
          (o) => o.value === serviceVal || o.text.includes(serviceVal.split('(')[0].trim())
        );
        if (match) selectEl.value = match.value;
      }
    };

    const handleSubmit = async (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement | null;
      if (!form || !form.matches('form[data-cuzmify-enquiry="true"]')) return;
      e.preventDefault();

      const fd = new FormData(form);
      const clientName = String(fd.get('clientName') || '').trim();
      const clientPhone = String(fd.get('clientPhone') || '').trim();
      const serviceName = String(fd.get('serviceName') || '').trim();
      const eventDate = String(fd.get('eventDate') || '').trim();
      const location = String(fd.get('location') || '').trim();
      const notes = String(fd.get('notes') || '').trim();

      const resolvedWa = form.getAttribute('data-whatsapp') || whatsappPhone || '';
      const resolvedBiz = form.getAttribute('data-business-name') || businessName;
      const feedbackEl = form.querySelector<HTMLElement>('[data-cuzmify-enquiry-feedback="true"]');
      const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');

      if (submitBtn) submitBtn.disabled = true;
      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.textContent = 'Saving your enquiry…';
      }

      const localWaUrl = buildCustomerToVendorWhatsAppUrl(resolvedWa, {
        businessName: resolvedBiz,
        clientName,
        clientPhone,
        serviceName,
        eventDate,
        location,
        notes,
      });

      let finalWaUrl = localWaUrl;

      try {
        const res = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            siteId: form.getAttribute('data-site-id') || siteId,
            domain,
            businessName: resolvedBiz,
            fallbackWhatsapp: resolvedWa,
            clientName,
            clientPhone,
            serviceName,
            eventDate,
            location,
            notes,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.whatsappUrl) finalWaUrl = data.whatsappUrl;
        }
      } catch {
        // Fallback to client-built WhatsApp link if offline/flaky 3G
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }

      if (finalWaUrl) {
        if (feedbackEl) {
          feedbackEl.textContent = '✓ Enquiry recorded! Opening WhatsApp…';
        }
        window.location.href = finalWaUrl;
      } else {
        if (feedbackEl) {
          feedbackEl.textContent = `✓ Thank you, ${clientName}! Your enquiry has been sent to ${resolvedBiz}.`;
        }
        form.reset();
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
    };
  }, [siteId, domain, businessName, whatsappPhone]);

  return null;
}
