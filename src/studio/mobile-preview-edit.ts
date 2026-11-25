import type { BusinessBlueprint, MediaVaultAsset } from '@/core/blueprint-schema';

export type BlueprintCopyKey = Extract<keyof NonNullable<BusinessBlueprint['customCopy']>, string>;

export interface MobileImageTarget {
  role: 'hero' | 'service' | 'gallery';
  label: string;
  currentSrc: string;
  serviceId?: string;
  assetId?: string;
}

export type MobileTextTarget =
  | {
      kind: 'profile';
      key: 'name';
      label: string;
      value: string;
      multiline: false;
    }
  | {
      kind: 'copy';
      key: BlueprintCopyKey;
      label: string;
      value: string;
      multiline: boolean;
    }
  | {
      kind: 'service';
      serviceId: string;
      field: 'name' | 'description';
      label: string;
      value: string;
      multiline: boolean;
    }
  | {
      kind: 'service_price';
      serviceId: string;
      label: string;
      value: string;
      multiline: false;
    };

const COPY_FIELD_META: Record<
  string,
  { key: BlueprintCopyKey; label: string; multiline: boolean; stripArrow?: boolean }
> = {
  headline: { key: 'headline', label: 'Hero Headline', multiline: true },
  subheadline: { key: 'subheadline', label: 'Hero Bio / Subheadline', multiline: true },
  'hero-badge': { key: 'heroBadge', label: 'Hero Badge', multiline: false },
  'primary-cta': { key: 'primaryCta', label: 'Primary CTA Button', multiline: false, stripArrow: true },
  'services-eyebrow': { key: 'servicesEyebrow', label: 'Services Eyebrow', multiline: false },
  'services-heading': { key: 'servicesHeading', label: 'Services Heading', multiline: false },
  'service-item-cta': { key: 'serviceItemCta', label: 'Service Button Label', multiline: false, stripArrow: true },
  'portfolio-eyebrow': { key: 'portfolioEyebrow', label: 'Portfolio Eyebrow', multiline: false },
  'portfolio-headline': { key: 'portfolioHeading', label: 'Portfolio Heading', multiline: false },
  'enquiry-eyebrow': { key: 'enquiryEyebrow', label: 'Booking Eyebrow', multiline: false },
  'enquiry-heading': { key: 'enquiryHeading', label: 'Booking Heading', multiline: false },
  'enquiry-subheading': { key: 'enquirySubheading', label: 'Booking Subheading', multiline: true },
  'submit-button-text': { key: 'submitButtonText', label: 'Submit Button Text', multiline: false },
  'testimonials-heading': { key: 'testimonialsHeading', label: 'Testimonials Heading', multiline: false },
  'faq-heading': { key: 'faqHeading', label: 'FAQ Heading', multiline: false },
};

/**
 * Resolves a clicked <img> inside the mobile live preview to its semantic blueprint slot.
 */
export function resolveMobileImageTarget(imgEl: HTMLImageElement, bp: BusinessBlueprint): MobileImageTarget {
  const roleAttr = imgEl.getAttribute('data-cuzmify-img-role');
  const assetAttr = imgEl.getAttribute('data-cuzmify-asset-id') || undefined;
  const targetAttr =
    imgEl.getAttribute('data-cuzmify-target-id') ||
    imgEl.closest('[data-cuzmify-target-id]')?.getAttribute('data-cuzmify-target-id') ||
    undefined;
  const currentSrc = imgEl.getAttribute('src') || imgEl.src || '';

  if (roleAttr === 'service' || (targetAttr && imgEl.closest('[data-cuzmify-type="services"]'))) {
    const srv = bp.modules.services.items.find((s) => s.id === targetAttr);
    return {
      role: 'service',
      serviceId: targetAttr,
      label: srv ? `${srv.name} Photo` : 'Service Photo',
      currentSrc,
    };
  }

  if (roleAttr === 'hero' || imgEl.closest('[data-cuzmify-type="hero"], .cz-hero-media')) {
    return {
      role: 'hero',
      assetId: assetAttr,
      label: 'Hero Cover Photo',
      currentSrc,
    };
  }

  const resolvedAsset =
    (assetAttr ? bp.mediaVault.find((m) => m.id === assetAttr) : undefined) ||
    bp.mediaVault.find((m) => (m.thumbnailUrl || m.url) === currentSrc);

  return {
    role: 'gallery',
    assetId: resolvedAsset?.id || assetAttr,
    label: resolvedAsset?.name ? `Portfolio: ${resolvedAsset.name}` : 'Portfolio Photo',
    currentSrc,
  };
}

/**
 * Replaces the target image slot cleanly inside a cloned BusinessBlueprint.
 */
export function applyMobileImageReplacement(
  inputBp: BusinessBlueprint,
  target: MobileImageTarget,
  pickedAsset: MediaVaultAsset
): { blueprint: BusinessBlueprint; summary: string } {
  const bp: BusinessBlueprint = JSON.parse(JSON.stringify(inputBp));
  const nextUrl = pickedAsset.thumbnailUrl || pickedAsset.url;

  if (target.role === 'service' && target.serviceId) {
    bp.modules.services.items = bp.modules.services.items.map((srv) =>
      srv.id === target.serviceId ? { ...srv, imageUrl: nextUrl } : srv
    );
    bp.updatedAt = new Date().toISOString();
    return { blueprint: bp, summary: 'Updated service photo' };
  }

  const vault = [...(bp.mediaVault || [])];
  const existsIdx = vault.findIndex((m) => m.id === pickedAsset.id);
  if (existsIdx === -1) {
    vault.unshift({ ...pickedAsset });
  }

  if (target.role === 'hero') {
    const pickedIdx = vault.findIndex((m) => m.id === pickedAsset.id);
    if (pickedIdx >= 0) {
      const [chosen] = vault.splice(pickedIdx, 1);
      const updatedRest = vault.map((m, i) => (i === 0 && m.type === 'hero' ? { ...m, type: 'gallery' as const } : m));
      bp.mediaVault = [{ ...chosen, type: 'hero' }, ...updatedRest];
    }
    bp.updatedAt = new Date().toISOString();
    return { blueprint: bp, summary: 'Updated hero cover photo' };
  }

  // Gallery slot swap: swap clicked portfolio position with picked asset cleanly
  const targetIdx = target.assetId ? vault.findIndex((m) => m.id === target.assetId) : -1;
  const pickedIdx = vault.findIndex((m) => m.id === pickedAsset.id);
  if (targetIdx >= 0 && pickedIdx >= 0 && targetIdx !== pickedIdx) {
    const temp = vault[targetIdx];
    vault[targetIdx] = vault[pickedIdx];
    vault[pickedIdx] = temp;
  }
  bp.mediaVault = vault;
  bp.updatedAt = new Date().toISOString();
  return { blueprint: bp, summary: 'Updated portfolio photo' };
}

/**
 * Resolves a double-tapped text element inside the mobile preview to a blueprint field.
 */
export function resolveMobileTextTarget(el: HTMLElement, bp: BusinessBlueprint): MobileTextTarget | null {
  const fieldEl = el.closest('[data-cuzmify-field]') as HTMLElement | null;
  if (!fieldEl) return null;

  const field = fieldEl.getAttribute('data-cuzmify-field') || '';
  const rawText = (fieldEl.textContent || '').trim();

  if (field === 'business-name') {
    return {
      kind: 'profile',
      key: 'name',
      label: 'Business Name',
      value: bp.profile.name || rawText,
      multiline: false,
    };
  }

  const serviceContainer = fieldEl.closest('[data-cuzmify-target-id]') as HTMLElement | null;
  const serviceId = serviceContainer?.getAttribute('data-cuzmify-target-id') || '';

  if (serviceId) {
    const srv = bp.modules.services.items.find((s) => s.id === serviceId);
    if (srv) {
      if (field === 'service-name') {
        return {
          kind: 'service',
          serviceId,
          field: 'name',
          label: 'Service Title',
          value: srv.name,
          multiline: false,
        };
      }
      if (field === 'service-description') {
        return {
          kind: 'service',
          serviceId,
          field: 'description',
          label: `${srv.name} Description`,
          value: srv.description || '',
          multiline: true,
        };
      }
      if (field === 'service-price') {
        return {
          kind: 'service_price',
          serviceId,
          label: `${srv.name} Price (0 = Quote)`,
          value: srv.price > 0 ? String(srv.price) : '0',
          multiline: false,
        };
      }
    }
  }

  const copyMeta = COPY_FIELD_META[field];
  if (copyMeta) {
    const existing = bp.customCopy?.[copyMeta.key];
    const cleanFallback = copyMeta.stripArrow ? rawText.replace(/\s*→\s*$/, '').trim() : rawText;
    return {
      kind: 'copy',
      key: copyMeta.key,
      label: copyMeta.label,
      value: existing !== undefined && existing !== '' ? String(existing) : cleanFallback,
      multiline: copyMeta.multiline,
    };
  }

  return null;
}

/**
 * Writes a mobile inline text edit back into a cloned BusinessBlueprint.
 */
export function applyMobileTextEdit(
  inputBp: BusinessBlueprint,
  target: MobileTextTarget,
  nextRawValue: string
): { blueprint: BusinessBlueprint; summary: string } {
  const bp: BusinessBlueprint = JSON.parse(JSON.stringify(inputBp));
  const trimmed = nextRawValue.trim();

  if (target.kind === 'profile') {
    if (trimmed) {
      bp.profile = { ...bp.profile, name: trimmed.slice(0, 80) };
    }
    bp.updatedAt = new Date().toISOString();
    return { blueprint: bp, summary: `Updated ${target.label}` };
  }

  if (target.kind === 'service') {
    bp.modules.services.items = bp.modules.services.items.map((srv) =>
      srv.id === target.serviceId
        ? {
            ...srv,
            [target.field]: trimmed.slice(0, target.field === 'name' ? 80 : 220),
          }
        : srv
    );
    bp.updatedAt = new Date().toISOString();
    return { blueprint: bp, summary: `Updated ${target.label}` };
  }

  if (target.kind === 'service_price') {
    const parsed = parseFloat(trimmed.replace(/[^\d.]/g, ''));
    const numericPrice = !Number.isNaN(parsed) && parsed > 0 ? parsed : 0;
    bp.modules.services.items = bp.modules.services.items.map((srv) => {
      if (srv.id !== target.serviceId) return srv;
      const nextMode = numericPrice <= 0 ? 'quote' : srv.priceMode === 'quote' || !srv.priceMode ? 'fixed' : srv.priceMode;
      return { ...srv, price: numericPrice, priceMode: nextMode };
    });
    bp.updatedAt = new Date().toISOString();
    return { blueprint: bp, summary: `Updated ${target.label}` };
  }

  bp.customCopy = {
    ...(bp.customCopy || {}),
    [target.key]: trimmed.slice(0, 260),
  };
  bp.updatedAt = new Date().toISOString();
  return { blueprint: bp, summary: `Updated ${target.label}` };
}
