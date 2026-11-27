import type { BlueprintSlotId, BusinessBlueprint, MediaVaultAsset } from '@/core/blueprint-schema';
import {
  getActiveSlotInjections,
  resolveTemplateEngineId,
} from '@/core/template-engines';
import {
  getAssetRenderSource,
  isVideoMediaUrl,
  resolveAssetMediaKind,
  type MediaKind,
} from '@/core/media-utils';

export type BlueprintCopyKey = Extract<keyof NonNullable<BusinessBlueprint['customCopy']>, string>;

export interface MobileImageTarget {
  role: 'hero' | 'service' | 'gallery';
  label: string;
  currentSrc: string;
  mediaKind?: MediaKind;
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
    }
  | {
      kind: 'slot_text';
      slot: BlueprintSlotId;
      originalText: string;
      occurrenceIndex: number;
      label: string;
      value: string;
      multiline: boolean;
    }
  | {
      kind: 'custom_section';
      sectionId: string;
      part: 'title' | 'eyebrow' | 'subtitle' | 'ctaText' | 'item_label' | 'item_detail' | 'html_text';
      itemIndex?: number;
      originalText?: string;
      occurrenceIndex?: number;
      label: string;
      value: string;
      multiline: boolean;
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
 * Resolves a clicked <img> or <video> inside the mobile live preview to its semantic blueprint slot.
 */
export function resolveMobileImageTarget(
  mediaEl: HTMLImageElement | HTMLVideoElement,
  bp: BusinessBlueprint
): MobileImageTarget {
  const roleAttr = mediaEl.getAttribute('data-cuzmify-img-role');
  const assetAttr = mediaEl.getAttribute('data-cuzmify-asset-id') || undefined;
  const targetAttr =
    mediaEl.getAttribute('data-cuzmify-target-id') ||
    mediaEl.closest('[data-cuzmify-target-id]')?.getAttribute('data-cuzmify-target-id') ||
    undefined;
  const currentSrc =
    mediaEl.getAttribute('src') ||
    mediaEl.getAttribute('poster') ||
    mediaEl.currentSrc ||
    (mediaEl as HTMLImageElement).src ||
    '';
  const tagName = mediaEl.tagName?.toLowerCase();
  const explicitKind = mediaEl.getAttribute('data-cuzmify-media-kind');
  const mediaKind: MediaKind =
    explicitKind === 'video' || tagName === 'video' || isVideoMediaUrl(currentSrc) ? 'video' : 'image';

  if (roleAttr === 'service' || (targetAttr && mediaEl.closest('[data-cuzmify-type="services"]'))) {
    const srv = bp.modules.services.items.find((s) => s.id === targetAttr);
    return {
      role: 'service',
      serviceId: targetAttr,
      label: srv ? `${srv.name} ${mediaKind === 'video' ? 'Video' : 'Photo'}` : 'Service Media',
      currentSrc,
      mediaKind,
    };
  }

  if (roleAttr === 'hero' || mediaEl.closest('[data-cuzmify-type="hero"], .cz-hero-media')) {
    return {
      role: 'hero',
      assetId: assetAttr,
      label: mediaKind === 'video' ? 'Hero Cover Video' : 'Hero Cover Photo',
      currentSrc,
      mediaKind,
    };
  }

  const resolvedAsset =
    (assetAttr ? bp.mediaVault.find((m) => m.id === assetAttr) : undefined) ||
    bp.mediaVault.find(
      (m) => m.url === currentSrc || m.thumbnailUrl === currentSrc || getAssetRenderSource(m) === currentSrc
    );

  return {
    role: 'gallery',
    assetId: resolvedAsset?.id || assetAttr,
    label: resolvedAsset?.name ? `Portfolio: ${resolvedAsset.name}` : 'Portfolio Media',
    currentSrc,
    mediaKind: resolvedAsset ? resolveAssetMediaKind(resolvedAsset) : mediaKind,
  };
}

/**
 * Replaces the target image/video slot cleanly inside a cloned BusinessBlueprint.
 */
export function applyMobileImageReplacement(
  inputBp: BusinessBlueprint,
  target: MobileImageTarget,
  pickedAsset: MediaVaultAsset
): { blueprint: BusinessBlueprint; summary: string } {
  const bp: BusinessBlueprint = JSON.parse(JSON.stringify(inputBp));
  const pickedKind = resolveAssetMediaKind(pickedAsset);
  const nextUrl = getAssetRenderSource(pickedAsset);
  const kindNoun = pickedKind === 'video' ? 'video' : 'photo';

  if (target.role === 'service' && target.serviceId) {
    bp.modules.services.items = bp.modules.services.items.map((srv) =>
      srv.id === target.serviceId ? { ...srv, imageUrl: nextUrl } : srv
    );
    bp.updatedAt = new Date().toISOString();
    return { blueprint: bp, summary: `Updated service ${kindNoun}` };
  }

  const vault = [...(bp.mediaVault || [])];
  const existsIdx = vault.findIndex((m) => m.id === pickedAsset.id);
  if (existsIdx === -1) {
    vault.unshift({ ...pickedAsset, mediaKind: pickedKind });
  }

  if (target.role === 'hero') {
    const pickedIdx = vault.findIndex((m) => m.id === pickedAsset.id);
    if (pickedIdx >= 0) {
      const [chosen] = vault.splice(pickedIdx, 1);
      const updatedRest = vault.map((m, i) =>
        i === 0 && m.type === 'hero'
          ? { ...m, type: (resolveAssetMediaKind(m) === 'video' ? 'video' : 'gallery') as MediaVaultAsset['type'] }
          : m
      );
      bp.mediaVault = [{ ...chosen, type: 'hero', mediaKind: pickedKind }, ...updatedRest];
    }
    bp.updatedAt = new Date().toISOString();
    return { blueprint: bp, summary: `Updated hero cover ${kindNoun}` };
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
  return { blueprint: bp, summary: `Updated portfolio ${kindNoun}` };
}

const INLINE_PHRASING_TAGS = new Set([
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'P',
  'SPAN',
  'A',
  'LI',
  'STRONG',
  'B',
  'EM',
  'I',
  'SMALL',
  'LABEL',
  'BLOCKQUOTE',
  'FOOTER',
]);

const NON_TEXT_TAGS = new Set([
  'IMG',
  'VIDEO',
  'SVG',
  'PATH',
  'CIRCLE',
  'RECT',
  'LINE',
  'POLYLINE',
  'POLYGON',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'FORM',
  'HR',
  'BR',
]);

function normalizeInlineText(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function escapeHtmlBasic(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  bull: '•',
  middot: '·',
  mdash: '—',
  ndash: '–',
  rarr: '→',
  larr: '←',
  hearts: '♥',
  sparkles: '✨',
};

function decodeHtmlEntities(raw: string): string {
  return raw.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (full, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = parseInt(entity.slice(2), 16);
      return Number.isNaN(code) ? full : String.fromCodePoint(code);
    }
    if (entity.startsWith('#')) {
      const code = parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? full : String.fromCodePoint(code);
    }
    const mapped = NAMED_HTML_ENTITIES[entity.toLowerCase()];
    return mapped !== undefined ? mapped : full;
  });
}

/**
 * Replaces a targeted visible text string inside an HTML fragment without touching tag names or attributes.
 */
export function replaceTextInHtmlFragment(
  rawHtml: string,
  originalText: string,
  nextText: string,
  occurrenceIndex = 0
): { html: string; replaced: boolean } {
  const targetNorm = normalizeInlineText(originalText);
  if (!rawHtml || !targetNorm) return { html: rawHtml, replaced: false };
  const escapedNext = escapeHtmlBasic(nextText);

  // Pass 1: exact text-node match between HTML tags (never touches attributes inside <...>)
  const tokens = rawHtml.split(/(<[^>]+>)/g);
  let seen = 0;
  for (let i = 0; i < tokens.length; i += 2) {
    const decoded = decodeHtmlEntities(tokens[i]);
    if (normalizeInlineText(decoded) === targetNorm) {
      if (seen === occurrenceIndex) {
        const leadMatch = tokens[i].match(/^\s*/)?.[0] || '';
        const trailMatch = tokens[i].match(/\s*$/)?.[0] || '';
        tokens[i] = `${leadMatch}${escapedNext}${trailMatch}`;
        return { html: tokens.join(''), replaced: true };
      }
      seen += 1;
    }
  }

  // Pass 2: phrasing element match when inline tags (e.g. <strong>, <span>) split a single sentence
  let elemSeen = 0;
  let elemReplaced = false;
  const phrasingRe = /<(h[1-6]|p|span|a|li|small|strong|em|b|i|blockquote|div)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  const nextHtml = rawHtml.replace(phrasingRe, (full, tag: string, attrs: string, inner: string) => {
    if (elemReplaced) return full;
    if (/<(?:div|section|ul|ol|table|form|nav|header|footer)\b/i.test(inner)) return full;
    const stripped = normalizeInlineText(decodeHtmlEntities(inner.replace(/<[^>]+>/g, '')));
    if (stripped === targetNorm) {
      if (elemSeen === occurrenceIndex) {
        elemReplaced = true;
        return `<${tag}${attrs}>${escapedNext}</${tag}>`;
      }
      elemSeen += 1;
    }
    return full;
  });

  return { html: nextHtml, replaced: elemReplaced };
}

/**
 * Finds the nearest inline-editable text element on Mobile Studio, supporting standard
 * `[data-cuzmify-field]` elements as well as AI-injected slots (`[data-cuzmify-slot="footer"]`, etc.)
 * and `custom-section` blocks.
 */
export function findEditableMobileTextElement(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  const fieldEl = el.closest('[data-cuzmify-field]') as HTMLElement | null;
  if (fieldEl) return fieldEl;

  const container = el.closest('[data-cuzmify-slot], section[data-cuzmify-type="custom-section"]') as HTMLElement | null;
  if (!container) return null;

  let curr: HTMLElement | null = el;
  while (curr && container.contains(curr)) {
    const tag = curr.tagName?.toUpperCase() || '';
    if (NON_TEXT_TAGS.has(tag)) return null;

    const text = normalizeInlineText(curr.textContent || '');
    if (text.length > 0 && text.length <= 360) {
      const hasBlockDescendants = Boolean(
        curr.querySelector('div, section, ul, ol, table, form, header, nav, footer, h1, h2, h3, h4, p')
      );
      if (curr.children.length === 0 || (INLINE_PHRASING_TAGS.has(tag) && !hasBlockDescendants)) {
        return curr;
      }
    }
    if (curr === container) break;
    curr = curr.parentElement;
  }

  return null;
}

function formatSlotLabel(slot: string): string {
  const clean = slot.replace(/_/g, ' ').trim();
  return clean ? `${clean.charAt(0).toUpperCase() + clean.slice(1)} Text` : 'Section Text';
}

/**
 * Resolves a double-tapped text element inside the mobile preview to a blueprint field,
 * AI-injected slot text node, or custom section field.
 */
export function resolveMobileTextTarget(el: HTMLElement, bp: BusinessBlueprint): MobileTextTarget | null {
  const fieldEl = el.closest('[data-cuzmify-field]') as HTMLElement | null;
  if (fieldEl) {
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
  }

  const editableEl = findEditableMobileTextElement(el);
  if (!editableEl) return null;
  const tappedText = normalizeInlineText(editableEl.textContent || '');
  if (!tappedText) return null;

  // 2. AI-injected slot text (e.g. footer, top_bar, hero_below, etc.)
  const slotContainer = editableEl.closest('[data-cuzmify-slot]') as HTMLElement | null;
  if (slotContainer) {
    const slot = (slotContainer.getAttribute('data-cuzmify-slot') || 'footer') as BlueprintSlotId;
    const activeTpl = resolveTemplateEngineId(bp.templateId);
    const activeInj = getActiveSlotInjections(activeTpl, bp);
    if (activeInj?.[slot]) {
      // Count earlier leaf elements inside this slot sharing the exact same text
      let occurrenceIndex = 0;
      const allDescendants = Array.from(slotContainer.querySelectorAll('*')) as HTMLElement[];
      for (const node of allDescendants) {
        if (node === editableEl) break;
        if (node.children.length === 0 && normalizeInlineText(node.textContent || '') === tappedText) {
          occurrenceIndex += 1;
        }
      }
      return {
        kind: 'slot_text',
        slot,
        originalText: tappedText,
        occurrenceIndex,
        label: formatSlotLabel(slot),
        value: tappedText,
        multiline: tappedText.length > 60 || editableEl.tagName === 'P',
      };
    }
  }

  // 3. Structured or custom-HTML section in bp.customSections
  const customSecEl = editableEl.closest('section[data-cuzmify-type="custom-section"]') as HTMLElement | null;
  if (customSecEl) {
    const sectionId = customSecEl.getAttribute('id') || '';
    const sec = (bp.customSections || []).find((s) => s.id === sectionId);
    if (sec) {
      if (sec.layout === 'custom_html' && sec.html) {
        return {
          kind: 'custom_section',
          sectionId,
          part: 'html_text',
          originalText: tappedText,
          occurrenceIndex: 0,
          label: `${sec.title || 'Custom Section'} Text`,
          value: tappedText,
          multiline: tappedText.length > 60 || editableEl.tagName === 'P',
        };
      }
      if (sec.title && normalizeInlineText(sec.title) === tappedText) {
        return {
          kind: 'custom_section',
          sectionId,
          part: 'title',
          label: 'Section Heading',
          value: sec.title,
          multiline: false,
        };
      }
      if (sec.eyebrow && normalizeInlineText(sec.eyebrow) === tappedText) {
        return {
          kind: 'custom_section',
          sectionId,
          part: 'eyebrow',
          label: 'Section Eyebrow',
          value: sec.eyebrow,
          multiline: false,
        };
      }
      if (sec.subtitle && normalizeInlineText(sec.subtitle) === tappedText) {
        return {
          kind: 'custom_section',
          sectionId,
          part: 'subtitle',
          label: 'Section Subtitle',
          value: sec.subtitle,
          multiline: true,
        };
      }
      const strippedArrow = tappedText.replace(/\s*→\s*$/, '').trim();
      if (sec.ctaText && normalizeInlineText(sec.ctaText) === strippedArrow) {
        return {
          kind: 'custom_section',
          sectionId,
          part: 'ctaText',
          label: 'Button Label',
          value: sec.ctaText,
          multiline: false,
        };
      }
      const items = sec.items || [];
      const strippedCheck = tappedText.replace(/^✓\s*/, '').trim();
      for (let i = 0; i < items.length; i++) {
        if (items[i].label && normalizeInlineText(items[i].label) === strippedCheck) {
          return {
            kind: 'custom_section',
            sectionId,
            part: 'item_label',
            itemIndex: i,
            label: 'Item Title',
            value: items[i].label,
            multiline: false,
          };
        }
        if (items[i].detail && normalizeInlineText(items[i].detail) === tappedText) {
          return {
            kind: 'custom_section',
            sectionId,
            part: 'item_detail',
            itemIndex: i,
            label: 'Item Detail',
            value: items[i].detail || '',
            multiline: true,
          };
        }
      }
    }
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

  if (target.kind === 'slot_text') {
    const activeTpl = resolveTemplateEngineId(bp.templateId);
    const currentHtml = bp.templateInjections?.[activeTpl]?.[target.slot] ?? bp.injections?.[target.slot] ?? '';
    if (currentHtml && trimmed) {
      const { html: updatedHtml, replaced } = replaceTextInHtmlFragment(
        currentHtml,
        target.originalText,
        trimmed.slice(0, 360),
        target.occurrenceIndex
      );
      if (replaced) {
        const prevTplInj = bp.templateInjections?.[activeTpl] || (bp.injections ? { ...bp.injections } : {});
        bp.templateInjections = {
          ...(bp.templateInjections || {}),
          [activeTpl]: {
            ...prevTplInj,
            [target.slot]: updatedHtml,
          },
        };
        if (bp.injections?.[target.slot] !== undefined) {
          bp.injections = {
            ...bp.injections,
            [target.slot]: updatedHtml,
          };
        }
      }
    }
    bp.updatedAt = new Date().toISOString();
    return { blueprint: bp, summary: `Updated ${target.label}` };
  }

  if (target.kind === 'custom_section') {
    bp.customSections = (bp.customSections || []).map((sec) => {
      if (sec.id !== target.sectionId) return sec;
      if (target.part === 'html_text' && sec.html && target.originalText) {
        const { html: nextHtml } = replaceTextInHtmlFragment(
          sec.html,
          target.originalText,
          trimmed.slice(0, 360),
          target.occurrenceIndex || 0
        );
        return { ...sec, html: nextHtml };
      }
      if (target.part === 'title') return { ...sec, title: trimmed.slice(0, 120) };
      if (target.part === 'eyebrow') return { ...sec, eyebrow: trimmed.slice(0, 60) };
      if (target.part === 'subtitle') return { ...sec, subtitle: trimmed.slice(0, 260) };
      if (target.part === 'ctaText') return { ...sec, ctaText: trimmed.slice(0, 60) };
      if (target.part === 'item_label' && typeof target.itemIndex === 'number' && Array.isArray(sec.items)) {
        const nextItems = sec.items.map((it, idx) =>
          idx === target.itemIndex ? { ...it, label: trimmed.slice(0, 90) } : it
        );
        return { ...sec, items: nextItems };
      }
      if (target.part === 'item_detail' && typeof target.itemIndex === 'number' && Array.isArray(sec.items)) {
        const nextItems = sec.items.map((it, idx) =>
          idx === target.itemIndex ? { ...it, detail: trimmed.slice(0, 220) } : it
        );
        return { ...sec, items: nextItems };
      }
      return sec;
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
