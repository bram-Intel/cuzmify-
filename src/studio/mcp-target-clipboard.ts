import type { BusinessBlueprint } from '@/core/blueprint-schema';
import { isVideoMediaUrl, type MediaKind } from '@/core/media-utils';

export interface CapturedElementSnapshot {
  siteId?: string;
  siteName?: string;
  templateId?: string;
  viewport?: 'mobile' | 'tablet' | 'desktop';
  tagName: string;
  id?: string;
  sectionId?: string;
  sectionType?: string;
  cuzmifyField?: string;
  cuzmifyTargetId?: string;
  cuzmifyAssetId?: string;
  cuzmifyImgRole?: string;
  cuzmifySlot?: string;
  mediaKind?: MediaKind;
  selector: string;
  text?: string;
  imageSrc?: string;
  posterSrc?: string;
  href?: string;
  classes?: string;
  htmlSnippet?: string;
}

function sanitizeImageRef(rawSrc?: string, assetId?: string, role?: string, kind: MediaKind = 'image'): string {
  if (!rawSrc) return '';
  if (rawSrc.startsWith('data:')) {
    return `[embedded-vault-${kind}${assetId ? ` id=${assetId}` : ''}${role ? ` role=${role}` : ''}]`;
  }
  return rawSrc.slice(0, 260);
}

/**
 * Strips huge base64 data: URIs inside HTML snippets so pasted element targets stay compact and agent-friendly.
 */
export function sanitizeHtmlSnippetForMcp(rawHtml: string, maxLen = 700): string {
  if (!rawHtml) return '';
  const compact = rawHtml
    .replace(/data:image\/[^;"'\s)]+;base64,[A-Za-z0-9+/=]+/gi, '[uploaded-image-data]')
    .replace(/data:video\/[^;"'\s)]+;base64,[A-Za-z0-9+/=]+/gi, '[uploaded-video-data]')
    .replace(/\s+/g, ' ')
    .trim();
  if (compact.length <= maxLen) return compact;
  return `${compact.slice(0, maxLen)}…`;
}

function buildCssSelector(el: HTMLElement, sectionId?: string, id?: string, field?: string, targetId?: string): string {
  const tag = el.tagName.toLowerCase();
  if (id) return `#${id}`;
  if (targetId && field) return `[data-cuzmify-target-id="${targetId}"] [data-cuzmify-field="${field}"]`;
  if (targetId) return `[data-cuzmify-target-id="${targetId}"]`;
  if (field && sectionId) return `#${sectionId} [data-cuzmify-field="${field}"]`;
  if (field) return `[data-cuzmify-field="${field}"]`;

  const firstClass = (el.getAttribute('class') || '')
    .split(/\s+/)
    .find((c) => c && !c.startsWith('gjs-') && !c.startsWith('cz-mobile'));
  const base = firstClass ? `${tag}.${firstClass}` : tag;
  return sectionId ? `#${sectionId} ${base}` : base;
}

/**
 * Captures an agent-ready element snapshot directly from any live DOM element
 * (used identically by Desktop GrapesJS selection and Mobile tap-to-pick).
 */
export function buildElementSnapshotFromDom(
  el: HTMLElement,
  opts?: {
    siteId?: string;
    blueprint?: BusinessBlueprint | null;
    viewport?: 'mobile' | 'tablet' | 'desktop';
    rawHtmlOverride?: string;
  }
): CapturedElementSnapshot {
  const bp = opts?.blueprint;
  const tagName = el.tagName.toLowerCase();
  const id = el.getAttribute('id') || undefined;
  const sectionEl = el.closest('section[id], section[data-cuzmify-type]') as HTMLElement | null;
  const sectionId = sectionEl?.getAttribute('id') || undefined;
  const sectionType = sectionEl?.getAttribute('data-cuzmify-type') || undefined;

  const cuzmifyField =
    el.getAttribute('data-cuzmify-field') ||
    el.closest('[data-cuzmify-field]')?.getAttribute('data-cuzmify-field') ||
    undefined;
  const cuzmifyTargetId =
    el.getAttribute('data-cuzmify-target-id') ||
    el.closest('[data-cuzmify-target-id]')?.getAttribute('data-cuzmify-target-id') ||
    undefined;
  const cuzmifyAssetId = el.getAttribute('data-cuzmify-asset-id') || undefined;
  const cuzmifyImgRole = el.getAttribute('data-cuzmify-img-role') || undefined;
  const cuzmifySlot =
    el.getAttribute('data-cuzmify-slot') ||
    el.closest('[data-cuzmify-slot]')?.getAttribute('data-cuzmify-slot') ||
    undefined;

  const rawText = (el.textContent || '').replace(/\s+/g, ' ').trim();
  const mediaChild =
    tagName === 'img' || tagName === 'video' ? el : (el.querySelector('img, video') as HTMLElement | null);
  const rawImgSrc = mediaChild?.getAttribute('src') || undefined;
  const rawPosterSrc =
    mediaChild?.tagName?.toLowerCase() === 'video' ? mediaChild.getAttribute('poster') || undefined : undefined;
  const explicitKind =
    mediaChild?.getAttribute('data-cuzmify-media-kind') || el.getAttribute('data-cuzmify-media-kind');
  const mediaKind: MediaKind | undefined = mediaChild
    ? explicitKind === 'video' || mediaChild.tagName.toLowerCase() === 'video' || isVideoMediaUrl(rawImgSrc)
      ? 'video'
      : 'image'
    : undefined;
  const href = el.getAttribute('href') || el.closest('a')?.getAttribute('href') || undefined;
  const classes = (el.getAttribute('class') || '')
    .split(/\s+/)
    .filter((c) => c && !c.startsWith('gjs-'))
    .join(' ')
    .trim() || undefined;

  const selector = buildCssSelector(el, sectionId, id, cuzmifyField, cuzmifyTargetId);
  const htmlSnippet = sanitizeHtmlSnippetForMcp(opts?.rawHtmlOverride || el.outerHTML || '');

  return {
    siteId: opts?.siteId,
    siteName: bp?.profile?.name,
    templateId: bp?.templateId,
    viewport: opts?.viewport,
    tagName,
    id,
    sectionId,
    sectionType,
    cuzmifyField,
    cuzmifyTargetId,
    cuzmifyAssetId,
    cuzmifyImgRole,
    cuzmifySlot,
    mediaKind,
    selector,
    text: rawText ? rawText.slice(0, 180) : undefined,
    imageSrc: sanitizeImageRef(rawImgSrc, cuzmifyAssetId, cuzmifyImgRole, mediaKind || 'image') || undefined,
    posterSrc: rawPosterSrc
      ? sanitizeImageRef(rawPosterSrc, cuzmifyAssetId, cuzmifyImgRole, 'image') || undefined
      : undefined,
    href: href && !href.startsWith('javascript:') ? href.slice(0, 200) : undefined,
    classes,
    htmlSnippet: htmlSnippet || undefined,
  };
}

/**
 * Shared desktop helper: builds a snapshot from either a live GrapesJS element DOM node
 * or fallback component details, avoiding duplicate extraction logic across panels.
 */
export function buildElementSnapshotFromSelection(
  domEl: HTMLElement | null,
  details: {
    id?: string;
    tagName: string;
    text?: string;
    href?: string;
    classes?: string;
    htmlSnippet?: string;
  } | null,
  opts?: {
    siteId?: string;
    blueprint?: BusinessBlueprint | null;
    viewport?: 'mobile' | 'tablet' | 'desktop';
  }
): CapturedElementSnapshot | null {
  if (domEl) {
    return buildElementSnapshotFromDom(domEl, {
      ...opts,
      rawHtmlOverride: details?.htmlSnippet,
    });
  }
  if (!details) return null;
  return {
    siteId: opts?.siteId,
    siteName: opts?.blueprint?.profile?.name,
    templateId: opts?.blueprint?.templateId,
    viewport: opts?.viewport,
    tagName: details.tagName,
    id: details.id,
    selector: details.id ? `#${details.id}` : details.tagName,
    text: details.text,
    href: details.href,
    classes: details.classes,
    htmlSnippet: details.htmlSnippet ? sanitizeHtmlSnippetForMcp(details.htmlSnippet) : undefined,
  };
}

function inferSuggestedMcpTool(snap: CapturedElementSnapshot): string {
  if (snap.cuzmifySlot) return `inject_slot(slot="${snap.cuzmifySlot}")`;
  if (snap.cuzmifyTargetId && (snap.sectionType === 'services' || snap.sectionId === 'services' || snap.cuzmifyImgRole === 'service')) {
    return `upsert_service_package(id="${snap.cuzmifyTargetId}")`;
  }
  if (snap.cuzmifyImgRole === 'hero') return 'promote_media_to_hero / customize_template_design(heroImage*)';
  if (snap.cuzmifyField === 'headline' || snap.cuzmifyField === 'subheadline' || snap.cuzmifyField === 'business-name') {
    return 'update_business_profile or customize_template_copy';
  }
  if (snap.cuzmifyField) return `customize_template_copy / customize_template_design(selector="${snap.selector}")`;
  if (snap.sectionType === 'booking' || snap.tagName === 'button') {
    return 'inject_slot(submit_button_prefix/suffix) or customize_template_design';
  }
  return `customize_template_design(customCss for "${snap.selector}") or inject_slot / upsert_custom_section`;
}

/**
 * Formats a captured element snapshot into a clean, paste-ready block for external MCP agents.
 */
export function formatMcpElementReference(snap: CapturedElementSnapshot): string {
  const lines: string[] = ['[Cuzmify MCP Target Element]'];

  const siteMetaParts = [
    snap.siteName ? `site="${snap.siteName}"` : null,
    snap.siteId ? `siteId="${snap.siteId}"` : null,
    snap.templateId ? `template="${snap.templateId}"` : null,
    snap.viewport ? `viewport="${snap.viewport}"` : null,
  ].filter(Boolean);
  if (siteMetaParts.length > 0) lines.push(siteMetaParts.join(' | '));

  const domParts = [
    `element=<${snap.tagName}${snap.id ? `#${snap.id}` : ''}>`,
    snap.sectionId ? `section=#${snap.sectionId}` : snap.sectionType ? `sectionType=${snap.sectionType}` : null,
    `selector="${snap.selector}"`,
  ].filter(Boolean);
  lines.push(domParts.join(' | '));

  const bindingParts = [
    snap.cuzmifyField ? `field="${snap.cuzmifyField}"` : null,
    snap.cuzmifyTargetId ? `targetId="${snap.cuzmifyTargetId}"` : null,
    snap.cuzmifyImgRole ? `imgRole="${snap.cuzmifyImgRole}"` : null,
    snap.mediaKind ? `mediaKind="${snap.mediaKind}"` : null,
    snap.cuzmifyAssetId ? `assetId="${snap.cuzmifyAssetId}"` : null,
    snap.cuzmifySlot ? `slot="${snap.cuzmifySlot}"` : null,
  ].filter(Boolean);
  if (bindingParts.length > 0) lines.push(`bindings: ${bindingParts.join(' | ')}`);

  if (snap.text) lines.push(`text: "${snap.text}"`);
  if (snap.imageSrc) lines.push(`${snap.mediaKind === 'video' ? 'video' : 'image'}: ${snap.imageSrc}`);
  if (snap.posterSrc) lines.push(`poster: ${snap.posterSrc}`);
  if (snap.href) lines.push(`href: ${snap.href}`);
  lines.push(`mcpHint: ${inferSuggestedMcpTool(snap)}`);

  if (snap.htmlSnippet) {
    lines.push('html:');
    lines.push(snap.htmlSnippet);
  }

  return lines.join('\n');
}

/**
 * Cross-platform clipboard writer with iOS/Android Safari fallback.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below for restricted webviews / Safari gestures
    }
  }
  if (typeof document !== 'undefined') {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
  return false;
}
