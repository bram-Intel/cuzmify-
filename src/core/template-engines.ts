/**
 * CUZMIFY TEMPLATE ENGINES (3 DISTINCT LOSSLESS DESIGN SYSTEMS)
 *
 * Layer 1 (Owner Data): `BusinessBlueprint` — real photos, real services, real contact info.
 * Layer 2 (Niche Blueprint): `NicheBlueprint` — niche vocabulary & enquiry fields.
 * Layer 3 (Template Engine): Pure visual renderer `(templateId, blueprint) => { html, css, fullHtml, googleFontsUrl }`.
 *
 * Switching templates re-renders the exact same `BusinessBlueprint` through a new layout engine,
 * guaranteeing 0% data loss and fast mobile loads (max 2 Google Font families per template).
 */

import {
  SUPPORTED_CURRENCIES,
  type BlueprintSlotId,
  type BusinessBlueprint,
  type DeviceDesignOverrides,
  type MediaVaultAsset,
  type ServiceItem,
  type TemplateDesignOverrides,
} from './blueprint-schema';
import { resolveNicheBlueprint, type NicheBlueprint } from './niche-blueprints';
import {
  getAssetPosterUrl,
  getAssetRenderSource,
  isVideoMediaUrl,
  renderSmartMediaHtml,
  resolveAssetMediaKind,
} from './media-utils';

export type TemplateEngineId = 'editorial-atelier' | 'noir-showcase' | 'modern-studio';

export interface TemplateEngineMeta {
  id: TemplateEngineId;
  name: string;
  tagline: string;
  vibe: string;
  swatches: [string, string, string];
  googleFontsUrl: string;
}

export const TEMPLATE_ENGINES: Record<TemplateEngineId, TemplateEngineMeta> = {
  'editorial-atelier': {
    id: 'editorial-atelier',
    name: 'Editorial Atelier',
    tagline: 'Warm ivory paper, serif typography & numbered editorial menu',
    vibe: 'Luxury Editorial',
    swatches: ['#FAF7F2', '#1C1917', '#9A6B4C'],
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap',
  },
  'noir-showcase': {
    id: 'noir-showcase',
    name: 'Noir Showcase',
    tagline: 'Cinema obsidian backdrop, full-bleed cover & visual-first gallery',
    vibe: 'Dark Cinema',
    swatches: ['#09090B', '#FAFAFA', '#F59E0B'],
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Outfit:wght@600;700;800&display=swap',
  },
  'modern-studio': {
    id: 'modern-studio',
    name: 'Modern Studio',
    tagline: 'Crisp card grid, visual service tiles & sticky mobile booking bar',
    vibe: 'Clean & Crisp',
    swatches: ['#F8FAFC', '#0D5771', '#10B981'],
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap',
  },
};

export const TEMPLATE_ENGINE_LIST: TemplateEngineMeta[] = [
  TEMPLATE_ENGINES['editorial-atelier'],
  TEMPLATE_ENGINES['noir-showcase'],
  TEMPLATE_ENGINES['modern-studio'],
];

export function resolveTemplateEngineId(input?: string | null): TemplateEngineId {
  if (!input) return 'editorial-atelier';
  const clean = input.toLowerCase().trim();
  if (clean === 'noir-showcase' || clean.includes('noir') || clean.includes('dark') || clean.includes('sound') || clean.includes('luxe portrait')) {
    return 'noir-showcase';
  }
  if (clean === 'modern-studio' || clean.includes('modern') || clean.includes('vogue') || clean.includes('clean')) {
    return 'modern-studio';
  }
  return 'editorial-atelier';
}

export function escapeHtml(raw?: string | number | null): string {
  if (raw === null || raw === undefined) return '';
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatArrowCtaLabel(raw: string): string {
  const clean = raw.replace(/\s*[→➜]+\s*$/, '').trim();
  return clean ? `${clean} →` : '→';
}

export function formatServicePrice(srv: ServiceItem, currencySymbol: string): string {
  const mode = srv.priceMode || (srv.price > 0 ? 'fixed' : 'quote');
  if (mode === 'quote' || !srv.price || srv.price <= 0) {
    return 'Custom Quote';
  }
  const formatted = `${currencySymbol}${Number(srv.price).toLocaleString('en-US')}`;
  if (mode === 'starting_at') {
    return `From ${formatted}`;
  }
  return formatted;
}

function renderVaultSlotMedia(
  asset: MediaVaultAsset,
  opts: {
    role: 'hero' | 'gallery';
    alt: string;
    style: string;
    heroBackground?: boolean;
    controls?: boolean;
    lazy?: boolean;
  }
): string {
  const kind = resolveAssetMediaKind(asset);
  return renderSmartMediaHtml({
    src: getAssetRenderSource(asset),
    mediaKind: kind,
    poster: getAssetPosterUrl(asset),
    alt: opts.alt,
    role: opts.role,
    assetId: asset.id,
    style: opts.style,
    heroBackground: opts.heroBackground,
    controls: opts.controls,
    lazy: opts.lazy,
  });
}

function renderServiceSlotMedia(srv: ServiceItem, style: string): string {
  if (!srv.imageUrl) return '';
  return renderSmartMediaHtml({
    src: srv.imageUrl,
    mediaKind: isVideoMediaUrl(srv.imageUrl) ? 'video' : 'image',
    alt: srv.name,
    role: 'service',
    targetId: srv.id,
    style,
    lazy: true,
  });
}

function isSectionVisible(bp: BusinessBlueprint, section: string): boolean {
  return bp.sectionVisibility?.[section] !== false;
}

function getSafeHexColor(val?: string | null): string | null {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed) ? trimmed : null;
}

function getActiveDesignOverrides(templateId: TemplateEngineId, bp: BusinessBlueprint): TemplateDesignOverrides | undefined {
  return bp.templateDesignOverrides ? bp.templateDesignOverrides[templateId] : bp.designOverrides;
}

function compileDeviceDesignRules(dev?: DeviceDesignOverrides): string {
  if (!dev) return '';
  const rules: string[] = [];

  const pxVal =
    dev.pagePaddingX === 'compact' ? '14px' : dev.pagePaddingX === 'spacious' ? '32px' : dev.pagePaddingX === 'normal' ? '22px' : null;
  if (pxVal) {
    rules.push(`.cz-ea-container,.cz-nr-container,.cz-ms-container{padding-left:${pxVal} !important;padding-right:${pxVal} !important;}`);
  }

  const secVal =
    dev.sectionSpacing === 'compact' ? '32px' : dev.sectionSpacing === 'airy' ? '76px' : dev.sectionSpacing === 'normal' ? '52px' : null;
  if (secVal) {
    rules.push(`section[data-cuzmify-type]{padding-top:${secVal} !important;padding-bottom:${secVal} !important;}`);
  }

  if (dev.heroLayout === 'centered') {
    rules.push(`.cz-ea-hero-grid{grid-template-columns:1fr !important;text-align:center !important;justify-items:center;}.cz-ea-hero-grid > div:first-child,.cz-hero-text{text-align:center !important;display:flex;flex-direction:column;align-items:center;}.cz-hero-actions{justify-content:center !important;}`);
  } else if (dev.heroLayout === 'split') {
    rules.push(`.cz-ea-hero-grid{grid-template-columns:1.05fr 0.95fr !important;text-align:left !important;}.cz-hero-text{text-align:left !important;align-items:flex-start !important;}.cz-hero-actions{justify-content:flex-start !important;}`);
  }

  if (dev.heroTextAlign === 'center') {
    rules.push(`.cz-hero-text{text-align:center !important;display:flex;flex-direction:column;align-items:center;}.cz-hero-actions{justify-content:center !important;}`);
  } else if (dev.heroTextAlign === 'left') {
    rules.push(`.cz-hero-text{text-align:left !important;align-items:flex-start !important;}.cz-hero-actions{justify-content:flex-start !important;}`);
  }

  if (dev.hideHeroImage === true) {
    rules.push(`.cz-hero-media{display:none !important;}`);
  } else if (dev.hideHeroImage === false) {
    rules.push(`.cz-hero-media{display:block !important;}`);
  }

  const heroMediaDecls: string[] = [];
  if (dev.heroImageAspect === 'square') heroMediaDecls.push('aspect-ratio:1 / 1 !important;');
  else if (dev.heroImageAspect === 'landscape') heroMediaDecls.push('aspect-ratio:4 / 3 !important;');
  else if (dev.heroImageAspect === 'wide') heroMediaDecls.push('aspect-ratio:16 / 9 !important;');
  else if (dev.heroImageAspect === 'portrait') heroMediaDecls.push('aspect-ratio:4 / 5 !important;');
  else if (dev.heroImageAspect === 'auto') heroMediaDecls.push('aspect-ratio:auto !important;');

  if (typeof dev.heroImageMaxHeight === 'number' && !Number.isNaN(dev.heroImageMaxHeight)) {
    const h = Math.min(680, Math.max(140, Math.round(dev.heroImageMaxHeight)));
    heroMediaDecls.push(`max-height:${h}px !important;margin-left:auto;margin-right:auto;`);
  }
  if (dev.heroImageShape === 'arch') heroMediaDecls.push('border-radius:220px 220px 24px 24px !important;');
  else if (dev.heroImageShape === 'rounded') heroMediaDecls.push('border-radius:24px !important;');
  else if (dev.heroImageShape === 'card') heroMediaDecls.push('border-radius:12px !important;');
  else if (dev.heroImageShape === 'circle') heroMediaDecls.push('border-radius:9999px !important;aspect-ratio:1 / 1 !important;');

  if (heroMediaDecls.length > 0) rules.push(`.cz-hero-media{${heroMediaDecls.join('')}}`);

  if (dev.heroImageFit === 'contain') {
    rules.push(`.cz-hero-media{padding:16px;box-sizing:border-box;}.cz-hero-media img,.cz-hero-media video{object-fit:contain !important;border-radius:16px;}`);
  } else if (dev.heroImageFit === 'cover') {
    rules.push(`.cz-hero-media img,.cz-hero-media video{object-fit:cover !important;}`);
  }

  if (typeof dev.galleryColumns === 'number' && dev.galleryColumns >= 1 && dev.galleryColumns <= 4) {
    rules.push(`.gallery-grid{grid-template-columns:repeat(${Math.round(dev.galleryColumns)},1fr) !important;}`);
  }

  if (typeof dev.servicesColumns === 'number' && dev.servicesColumns >= 1 && dev.servicesColumns <= 3) {
    rules.push(`.services-grid{display:grid !important;grid-template-columns:repeat(${Math.round(dev.servicesColumns)},1fr) !important;gap:16px !important;}`);
  }

  if (dev.fontScale === 'compact') {
    rules.push(`.cz-hero-title{font-size:clamp(1.65rem,3.6vw,2.6rem) !important;}`);
  } else if (dev.fontScale === 'large') {
    rules.push(`.cz-hero-title{font-size:clamp(2.5rem,6vw,4.3rem) !important;}`);
  }

  return rules.join('');
}

function buildDesignOverrideCss(templateId: TemplateEngineId, bp: BusinessBlueprint): string {
  const ov = getActiveDesignOverrides(templateId, bp);
  if (!ov) return '';

  const accent = getSafeHexColor(ov.accentColor);
  const bg = getSafeHexColor(ov.backgroundColor);
  const surface = getSafeHexColor(ov.surfaceColor);
  const text = getSafeHexColor(ov.textColor);
  const radius =
    ov.buttonRadius === 'sharp' ? '4px' : ov.buttonRadius === 'rounded' ? '12px' : ov.buttonRadius === 'pill' ? '9999px' : null;

  const varLines: string[] = [];
  if (templateId === 'editorial-atelier') {
    if (accent) varLines.push(`--cz-accent:${accent};`);
    if (bg) varLines.push(`--cz-bg:${bg};`);
    if (surface) varLines.push(`--cz-surface:${surface};`);
    if (text) varLines.push(`--cz-ink:${text};`);
  } else if (templateId === 'noir-showcase') {
    if (accent) varLines.push(`--cz-noir-accent:${accent};`);
    if (bg) varLines.push(`--cz-noir-bg:${bg};`);
    if (surface) varLines.push(`--cz-noir-card:${surface};`);
    if (text) varLines.push(`--cz-noir-text:${text};`);
  } else {
    if (accent) varLines.push(`--cz-ms-primary:${accent};`);
    if (bg) varLines.push(`--cz-ms-bg:${bg};`);
    if (surface) varLines.push(`--cz-ms-card:${surface};`);
    if (text) varLines.push(`--cz-ms-ink:${text};`);
  }

  const fontOverrideCss =
    ov.fontMood === 'editorial_serif'
      ? `.cz-ea-root h1,.cz-ea-root h2,.cz-nr-root h1,.cz-nr-root h2,.cz-ms-root h1,.cz-ms-root h2{font-family:'Cormorant Garamond',Georgia,serif !important;letter-spacing:-0.01em;}`
      : ov.fontMood === 'modern_sans'
        ? `.cz-ea-root h1,.cz-ea-root h2,.cz-nr-root h1,.cz-nr-root h2,.cz-ms-root h1,.cz-ms-root h2{font-family:'Inter','Plus Jakarta Sans',system-ui,sans-serif !important;letter-spacing:-0.025em;}`
        : ov.fontMood === 'bold_display'
          ? `.cz-ea-root h1,.cz-ea-root h2,.cz-nr-root h1,.cz-nr-root h2,.cz-ms-root h1,.cz-ms-root h2{font-family:'Outfit',system-ui,sans-serif !important;font-weight:800 !important;letter-spacing:-0.03em;}`
          : '';

  const radiusCss = radius
    ? `.cz-ea-root a[href="#booking"],.cz-ea-root a[href="#services"],.cz-nr-root a[href="#booking"],.cz-nr-root a[href="#portfolio"],.cz-ms-root a[href="#booking"],.cz-submit-btn{border-radius:${radius} !important;}`
    : '';

  const varsCss = varLines.length > 0 ? `[data-cuzmify-template="${templateId}"]{${varLines.join('')}}` : '';
  const baseDeviceCss = compileDeviceDesignRules(ov);
  const mobileCss = compileDeviceDesignRules(ov.responsive?.mobile);
  const tabletCss = compileDeviceDesignRules(ov.responsive?.tablet);
  const desktopCss = compileDeviceDesignRules(ov.responsive?.desktop);
  const sanitizedCustomCss =
    typeof ov.customCss === 'string' && ov.customCss.trim()
      ? ov.customCss
          .trim()
          .slice(0, 6000)
          .replace(/<\/?[a-z!/][^>]*>/gi, '')
          .replace(/</g, '')
          .replace(/javascript:|expression\s*\(|@import|behavior\s*:|-moz-binding/gi, '')
      : '';
  const safeCustomCss = sanitizedCustomCss
    ? scopeCssToTemplate(sanitizedCustomCss, `[data-cuzmify-template="${templateId}"]`)
    : '';

  return [
    varsCss,
    fontOverrideCss,
    radiusCss,
    baseDeviceCss,
    mobileCss ? `@media (max-width:767px){${mobileCss}}` : '',
    tabletCss ? `@media (min-width:768px) and (max-width:1023px){${tabletCss}}` : '',
    desktopCss ? `@media (min-width:1024px){${desktopCss}}` : '',
    safeCustomCss,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Scopes arbitrary AI/user CSS strictly inside `[data-cuzmify-template="<id>"]` so global
 * selectors (`button`, `h1`, `body`, `*`, `:root`, etc.) can never leak into Studio UI or chrome.
 */
export function scopeCssToTemplate(rawCss: string, scopeSelector: string): string {
  const clean = rawCss.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!clean) return '';

  const splitTopLevelSelectors = (selText: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let paren = 0;
    let bracket = 0;
    for (let i = 0; i < selText.length; i++) {
      const ch = selText[i];
      if (ch === '(') paren++;
      else if (ch === ')') paren = Math.max(0, paren - 1);
      else if (ch === '[') bracket++;
      else if (ch === ']') bracket = Math.max(0, bracket - 1);
      if (ch === ',' && paren === 0 && bracket === 0) {
        if (cur.trim()) out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };

  const scopeSingleSelector = (sel: string): string => {
    const trimmed = sel.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith(scopeSelector) || trimmed.startsWith('[data-cuzmify-template')) {
      return trimmed;
    }
    // Rewrite global root/body/html references to the template container itself
    let rewritten = trimmed.replace(/(^|\s|,)(?:html|body|:root)(?=$|\s|::|:|\.|\[)/gi, `$1${scopeSelector}`);
    if (rewritten.startsWith(scopeSelector)) {
      return rewritten;
    }
    if (rewritten === '*') {
      return `${scopeSelector}, ${scopeSelector} *`;
    }
    if (rewritten.startsWith('::') || rewritten.startsWith(':')) {
      return `${scopeSelector} ${rewritten}`;
    }
    return `${scopeSelector} ${rewritten}`;
  };

  const scopeBlock = (cssChunk: string): string => {
    let out = '';
    let i = 0;
    const len = cssChunk.length;

    while (i < len) {
      while (i < len && /\s/.test(cssChunk[i])) i++;
      if (i >= len) break;

      const openIdx = cssChunk.indexOf('{', i);
      if (openIdx === -1) break;

      const header = cssChunk.slice(i, openIdx).trim();
      let depth = 1;
      let j = openIdx + 1;
      let inStr: string | null = null;
      while (j < len && depth > 0) {
        const ch = cssChunk[j];
        if (inStr) {
          if (ch === '\\') {
            j += 2;
            continue;
          }
          if (ch === inStr) inStr = null;
        } else {
          if (ch === '"' || ch === "'") inStr = ch;
          else if (ch === '{') depth++;
          else if (ch === '}') depth--;
        }
        j++;
      }

      const inner = cssChunk.slice(openIdx + 1, depth === 0 ? j - 1 : len);
      i = j;

      if (!header) continue;
      const lowerHeader = header.toLowerCase();

      if (lowerHeader.startsWith('@media') || lowerHeader.startsWith('@supports') || lowerHeader.startsWith('@container')) {
        const scopedInner = scopeBlock(inner);
        if (scopedInner) out += `${header}{${scopedInner}}`;
      } else if (lowerHeader.startsWith('@')) {
        // Keep @keyframes / @font-face / @property intact
        out += `${header}{${inner}}`;
      } else {
        const scopedSelectors = splitTopLevelSelectors(header)
          .map(scopeSingleSelector)
          .filter(Boolean)
          .join(', ');
        if (scopedSelectors) {
          out += `${scopedSelectors}{${inner}}`;
        }
      }
    }

    return out;
  };

  return scopeBlock(clean);
}

function sanitizeInjectableHtml(raw: string, maxLen = 12000): string {
  return raw
    .trim()
    .slice(0, maxLen)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(?:script|iframe|object|embed|link|meta|style)\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(?:javascript|vbscript):/gi, '');
}

export function getActiveSlotInjections(
  templateId: TemplateEngineId,
  bp: BusinessBlueprint
): Partial<Record<BlueprintSlotId, string>> | undefined {
  if (bp.templateInjections) {
    return bp.templateInjections[templateId];
  }
  // Legacy blueprints without templateInjections: only render injections on the template
  // they were authored for so bespoke HTML + templateDesignOverrides CSS never leak unstyled.
  return templateId === resolveTemplateEngineId(bp.templateId) ? bp.injections : undefined;
}

function renderSlotHtml(
  bp: BusinessBlueprint,
  slot: BlueprintSlotId,
  maxLen = 6000,
  templateId?: TemplateEngineId
): string {
  const activeTpl = templateId || resolveTemplateEngineId(bp.templateId);
  const inj = getActiveSlotInjections(activeTpl, bp);
  const raw = inj?.[slot];
  if (typeof raw !== 'string' || !raw.trim()) return '';
  return sanitizeInjectableHtml(raw, maxLen);
}

function renderSharedCustomSections(bp: BusinessBlueprint, templateId: TemplateEngineId): string {
  const list = (bp.customSections || []).filter((s) => Boolean(s?.title?.trim() || s?.html?.trim()));
  if (list.length === 0 || !isSectionVisible(bp, 'custom')) return '';

  const isDark = templateId === 'noir-showcase';
  const accent = isDark ? 'var(--cz-noir-accent)' : templateId === 'modern-studio' ? 'var(--cz-ms-primary)' : 'var(--cz-accent)';
  const surface = isDark ? 'var(--cz-noir-card)' : templateId === 'modern-studio' ? 'var(--cz-ms-card)' : 'var(--cz-surface)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : templateId === 'modern-studio' ? 'var(--cz-ms-border)' : 'var(--cz-border)';
  const muted = isDark ? 'var(--cz-noir-muted)' : templateId === 'modern-studio' ? 'var(--cz-ms-muted)' : 'var(--cz-muted)';
  const containerCls = isDark ? 'cz-nr-container' : templateId === 'modern-studio' ? 'cz-ms-container' : 'cz-ea-container';
  const headingCls = isDark ? 'cz-nr-display' : templateId === 'modern-studio' ? 'cz-ms-heading' : 'cz-ea-serif';

  return list
    .slice(0, 6)
    .map((sec) => {
      const indexedItems = (sec.items || [])
        .map((item, rawIdx) => ({ item, rawIdx }))
        .filter(({ item }) => Boolean(item.label?.trim() || item.detail?.trim()));
      let bodyHtml = '';

      if (sec.layout === 'custom_html' && sec.html?.trim()) {
        bodyHtml = sanitizeInjectableHtml(sec.html);
      } else if (sec.layout === 'banner_cta') {
        bodyHtml = `<div style="padding:28px 24px;border-radius:20px;border:1px solid ${border};background:${surface};display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;">
          <div style="max-width:620px;">
            ${sec.eyebrow ? `<span data-cuzmify-field="custom-eyebrow" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};font-weight:700;display:block;margin-bottom:6px;">${escapeHtml(sec.eyebrow)}</span>` : ''}
            <h2 data-cuzmify-field="custom-title" class="${headingCls}" style="font-size:clamp(1.45rem,3vw,2rem);font-weight:700;margin:0;">${escapeHtml(sec.title)}</h2>
            ${sec.subtitle ? `<p data-cuzmify-field="custom-subtitle" style="font-size:14px;color:${muted};line-height:1.6;margin:8px 0 0;">${escapeHtml(sec.subtitle)}</p>` : ''}
          </div>
          ${sec.ctaText ? `<a data-cuzmify-field="custom-cta" href="${escapeHtml(sec.ctaHref || '#booking')}" style="padding:12px 22px;border-radius:999px;background:${accent};color:#FFFFFF;font-size:13px;font-weight:700;text-decoration:none;white-space:nowrap;">${escapeHtml(formatArrowCtaLabel(sec.ctaText))}</a>` : ''}
        </div>`;
      } else if (sec.layout === 'checklist' || sec.layout === 'hours_info') {
        bodyHtml = `<div style="max-width:780px;margin:0 auto;">
          ${sec.eyebrow ? `<span data-cuzmify-field="custom-eyebrow" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};font-weight:700;display:block;margin-bottom:6px;">${escapeHtml(sec.eyebrow)}</span>` : ''}
          <h2 data-cuzmify-field="custom-title" class="${headingCls}" style="font-size:clamp(1.5rem,3vw,2.1rem);font-weight:700;margin:0 0 8px;">${escapeHtml(sec.title)}</h2>
          ${sec.subtitle ? `<p data-cuzmify-field="custom-subtitle" style="font-size:14px;color:${muted};line-height:1.6;margin:0 0 22px;">${escapeHtml(sec.subtitle)}</p>` : '<div style="height:14px;"></div>'}
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${indexedItems
              .map(
                ({ item: it, rawIdx }) => `<div data-cuzmify-item-index="${rawIdx}" style="padding:14px 18px;border-radius:14px;border:1px solid ${border};background:${surface};display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;justify-content:space-between;">
                  <strong data-cuzmify-field="custom-item-label" data-cuzmify-item-index="${rawIdx}" style="font-size:14px;">${sec.layout === 'checklist' ? '✓ ' : ''}${escapeHtml(it.label)}</strong>
                  ${it.detail ? `<span data-cuzmify-field="custom-item-detail" data-cuzmify-item-index="${rawIdx}" style="font-size:13px;color:${muted};">${escapeHtml(it.detail)}</span>` : ''}
                </div>`
              )
              .join('')}
          </div>
        </div>`;
      } else {
        bodyHtml = `<div>
          ${sec.eyebrow ? `<span data-cuzmify-field="custom-eyebrow" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};font-weight:700;display:block;margin-bottom:6px;">${escapeHtml(sec.eyebrow)}</span>` : ''}
          <h2 data-cuzmify-field="custom-title" class="${headingCls}" style="font-size:clamp(1.5rem,3vw,2.1rem);font-weight:700;margin:0 0 8px;">${escapeHtml(sec.title)}</h2>
          ${sec.subtitle ? `<p data-cuzmify-field="custom-subtitle" style="font-size:14px;color:${muted};line-height:1.6;margin:0 0 24px;max-width:620px;">${escapeHtml(sec.subtitle)}</p>` : '<div style="height:16px;"></div>'}
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
            ${indexedItems
              .map(
                ({ item: it, rawIdx }) => `<div data-cuzmify-item-index="${rawIdx}" style="padding:20px;border-radius:16px;border:1px solid ${border};background:${surface};">
                  <h3 data-cuzmify-field="custom-item-label" data-cuzmify-item-index="${rawIdx}" style="margin:0 0 6px;font-size:15px;font-weight:700;color:${accent};">${escapeHtml(it.label)}</h3>
                  ${it.detail ? `<p data-cuzmify-field="custom-item-detail" data-cuzmify-item-index="${rawIdx}" style="margin:0;font-size:13px;line-height:1.6;color:${muted};">${escapeHtml(it.detail)}</p>` : ''}
                </div>`
              )
              .join('')}
          </div>
        </div>`;
      }

      return `<section id="${escapeHtml(sec.id)}" data-cuzmify-type="custom-section" data-cuzmify-section-id="${escapeHtml(sec.id)}" style="padding:48px 0;border-top:1px solid ${border};">
        <div class="${containerCls}">
          ${bodyHtml}
        </div>
      </section>`;
    })
    .join('\n');
}

function assembleOrderedSections(
  sectionMap: Record<string, string>,
  requestedOrder: string[] | undefined,
  defaultOrder: string[]
): string {
  const baseOrder = Array.isArray(requestedOrder) && requestedOrder.length > 0 ? requestedOrder : defaultOrder;
  const seen = new Set<string>();
  const out: string[] = [];

  for (const rawKey of [...baseOrder, ...defaultOrder]) {
    const key = String(rawKey || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (sectionMap[key]) out.push(sectionMap[key]);
  }
  return out.join('\n');
}

function renderSharedTestimonialsSection(bp: BusinessBlueprint, isDark: boolean): string {
  const indexed = (bp.testimonials || [])
    .map((item, rawIdx) => ({ item, rawIdx }))
    .filter(({ item }) => Boolean(item.quote?.trim() && item.clientName?.trim()));
  if (indexed.length === 0 || !isSectionVisible(bp, 'testimonials')) return '';
  const heading = bp.customCopy?.testimonialsHeading || 'Client Love';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)';
  const cardBg = isDark ? 'var(--cz-noir-card, #141418)' : 'var(--cz-surface, #FFFFFF)';
  const muted = isDark ? '#A1A1AA' : '#57534E';
  return `<section id="testimonials" data-cuzmify-type="testimonials" style="padding:52px 0;border-top:1px solid ${border};">
    <div style="max-width:1080px;margin:0 auto;padding:0 20px;box-sizing:border-box;">
      <h2 data-cuzmify-field="testimonials-heading" style="font-size:clamp(1.45rem,3vw,2rem);font-weight:700;margin:0 0 24px;">${escapeHtml(heading)}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">
        ${indexed
          .slice(0, 6)
          .map(
            ({ item: t, rawIdx }) => `<blockquote data-cuzmify-target-id="${escapeHtml(t.id || '')}" data-cuzmify-item-index="${rawIdx}" style="margin:0;padding:22px;border-radius:18px;border:1px solid ${border};background:${cardBg};display:flex;flex-direction:column;justify-content:space-between;gap:14px;">
              <p data-cuzmify-field="testimonial-quote" data-cuzmify-item-index="${rawIdx}" style="margin:0;font-size:14px;line-height:1.65;">“${escapeHtml(t.quote)}”</p>
              <footer data-cuzmify-field="testimonial-client" data-cuzmify-item-index="${rawIdx}" style="font-size:12px;font-weight:700;color:${muted};">— ${escapeHtml(t.clientName)}${t.roleOrEvent ? ` • ${escapeHtml(t.roleOrEvent)}` : ''}</footer>
            </blockquote>`
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

function renderSharedFaqSection(bp: BusinessBlueprint, isDark: boolean): string {
  const indexed = (bp.faqs || [])
    .map((item, rawIdx) => ({ item, rawIdx }))
    .filter(({ item }) => Boolean(item.question?.trim() && item.answer?.trim()));
  if (indexed.length === 0 || !isSectionVisible(bp, 'faq')) return '';
  const heading = bp.customCopy?.faqHeading || 'Frequently Asked Questions';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)';
  const cardBg = isDark ? 'var(--cz-noir-card, #141418)' : 'var(--cz-surface, #FFFFFF)';
  const muted = isDark ? '#A1A1AA' : '#57534E';
  return `<section id="faq" data-cuzmify-type="faq" style="padding:52px 0;border-top:1px solid ${border};">
    <div style="max-width:820px;margin:0 auto;padding:0 20px;box-sizing:border-box;">
      <h2 data-cuzmify-field="faq-heading" style="font-size:clamp(1.45rem,3vw,2rem);font-weight:700;margin:0 0 22px;">${escapeHtml(heading)}</h2>
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${indexed
          .slice(0, 10)
          .map(
            ({ item: f, rawIdx }) => `<div data-cuzmify-target-id="${escapeHtml(f.id || '')}" data-cuzmify-item-index="${rawIdx}" style="padding:18px 20px;border-radius:16px;border:1px solid ${border};background:${cardBg};">
              <h3 data-cuzmify-field="faq-question" data-cuzmify-item-index="${rawIdx}" style="margin:0 0 6px;font-size:15px;font-weight:700;">${escapeHtml(f.question)}</h3>
              <p data-cuzmify-field="faq-answer" data-cuzmify-item-index="${rawIdx}" style="margin:0;font-size:13px;line-height:1.6;color:${muted};">${escapeHtml(f.answer)}</p>
            </div>`
          )
          .join('')}
      </div>
    </div>
  </section>`;
}

const WHATSAPP_BRAND_SVG =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="flex-shrink:0;"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.49 0 .14 5.34.14 11.92c0 2.1.55 4.15 1.59 5.96L0 24l6.33-1.66a11.9 11.9 0 0 0 5.73 1.46h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.17-3.47-8.4Zm-8.46 18.3h-.01a9.89 9.89 0 0 1-5.04-1.38l-.36-.22-3.76.99 1-3.66-.24-.38a9.87 9.87 0 0 1-1.51-5.21c0-5.46 4.44-9.9 9.91-9.9 2.65 0 5.14 1.03 7.01 2.9a9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.86-9.9 9.86Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.88 1.21 3.08.15.2 2.09 3.2 5.07 4.48.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg>';

const SPARKLES_BTN_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/></svg>';

const CALENDAR_BTN_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

function renderSubmitButtonIconHtml(iconMode: TemplateDesignOverrides['submitButtonIcon'], hasWhatsapp: boolean): string {
  const mode = iconMode || 'auto';
  if (mode === 'none') return '';
  if (mode === 'whatsapp' || (mode === 'auto' && hasWhatsapp)) return WHATSAPP_BRAND_SVG;
  if (mode === 'sparkles') return SPARKLES_BTN_SVG;
  if (mode === 'calendar') return CALENDAR_BTN_SVG;
  return '';
}

function buildWhatsAppDirectHref(phone: string, text: string): string {
  const clean = (phone || '').replace(/[^\d]/g, '');
  if (!clean) return '#booking';
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

function renderSharedEnquiryForm(
  bp: BusinessBlueprint,
  niche: NicheBlueprint,
  services: ServiceItem[],
  currencySymbol: string,
  siteId?: string,
  isDark = false
): string {
  const waPhone = (bp.modules?.whatsapp?.phoneNumber || bp.profile?.whatsapp || '').replace(/[^\d]/g, '');
  const activeTpl = resolveTemplateEngineId(bp.templateId);
  const activeOv = getActiveDesignOverrides(activeTpl, bp);
  const submitColor = getSafeHexColor(activeOv?.submitButtonColor) || '#25D366';
  const injectedPrefix = renderSlotHtml(bp, 'submit_button_prefix', 3000, activeTpl);
  const injectedSuffix = renderSlotHtml(bp, 'submit_button_suffix', 3000, activeTpl);
  const submitIconHtml = injectedPrefix || renderSubmitButtonIconHtml(activeOv?.submitButtonIcon, Boolean(waPhone));
  const submitLabel =
    bp.customCopy?.submitButtonText ||
    (waPhone
      ? `${formatArrowCtaLabel(bp.customCopy?.primaryCta || niche.vocabulary.primaryCta).replace(/\s*→$/, '')} via WhatsApp →`
      : 'Send Enquiry →');
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const inputBorder = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.14)';
  const inputColor = isDark ? '#FAFAFA' : '#1C1917';
  const labelColor = isDark ? '#A1A1AA' : '#57534E';

  const serviceOptionsHtml =
    services.length > 0
      ? `<option value="">Select a service / package</option>` +
        services
          .map((s) => {
            const pLabel = formatServicePrice(s, currencySymbol);
            const val = `${s.name} (${pLabel})`;
            return `<option value="${escapeHtml(val)}">${escapeHtml(s.name)} — ${escapeHtml(pLabel)}</option>`;
          })
          .join('') +
        `<option value="Custom / General Enquiry">Custom / General Enquiry</option>`
      : `<option value="General Booking / Custom Quote">General Booking / Custom Quote</option>`;

  const dynamicFieldsHtml = niche.enquiryFields
    .map((f) => {
      if (f.type === 'textarea') {
        return `<div class="cz-field">
          <label style="display:block;font-size:11px;font-weight:600;color:${labelColor};margin-bottom:6px;">${escapeHtml(f.label)}</label>
          <textarea name="${f.name}" rows="3" placeholder="${escapeHtml(f.placeholder)}" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${inputColor};font-size:16px;font-family:inherit;box-sizing:border-box;resize:vertical;"></textarea>
        </div>`;
      }
      return `<div class="cz-field">
        <label style="display:block;font-size:11px;font-weight:600;color:${labelColor};margin-bottom:6px;">${escapeHtml(f.label)}${f.required ? ' *' : ''}</label>
        <input type="${f.type}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${escapeHtml(f.placeholder)}" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${inputColor};font-size:16px;font-family:inherit;box-sizing:border-box;"/>
      </div>`;
    })
    .join('');

  return `<form
    data-cuzmify-enquiry="true"
    data-site-id="${escapeHtml(siteId || '')}"
    data-whatsapp="${escapeHtml(waPhone)}"
    data-business-name="${escapeHtml(bp.profile.name)}"
    style="display:flex;flex-direction:column;gap:14px;text-align:left;"
  >
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
      <div class="cz-field">
        <label style="display:block;font-size:11px;font-weight:600;color:${labelColor};margin-bottom:6px;">Your Name *</label>
        <input type="text" name="clientName" required placeholder="Full name" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${inputColor};font-size:16px;font-family:inherit;box-sizing:border-box;"/>
      </div>
      <div class="cz-field">
        <label style="display:block;font-size:11px;font-weight:600;color:${labelColor};margin-bottom:6px;">Your Phone / WhatsApp *</label>
        <input type="tel" name="clientPhone" required placeholder="e.g. 0803 000 0000" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${inputColor};font-size:16px;font-family:inherit;box-sizing:border-box;"/>
      </div>
    </div>

    <div class="cz-field">
      <label style="display:block;font-size:11px;font-weight:600;color:${labelColor};margin-bottom:6px;">Service / Package</label>
      <select name="serviceName" data-cuzmify-type="service-select" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${inputColor};font-size:16px;font-family:inherit;box-sizing:border-box;">
        ${serviceOptionsHtml}
      </select>
    </div>

    ${dynamicFieldsHtml}

    <button
      type="submit"
      class="cz-submit-btn"
      style="margin-top:6px;width:100%;padding:15px 20px;border-radius:14px;border:none;background:${submitColor};color:#FFFFFF;font-weight:700;font-size:15px;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 8px 24px rgba(37,211,102,0.25);"
    >
      ${submitIconHtml}
      <span data-cuzmify-field="submit-button-text">${escapeHtml(submitLabel)}</span>
      ${injectedSuffix}
    </button>
    <p data-cuzmify-enquiry-feedback="true" style="display:none;font-size:12px;text-align:center;margin:4px 0 0;color:#10B981;font-weight:600;"></p>
  </form>`;
}

interface HeroVariantCtx {
  templateId: TemplateEngineId;
  bp: BusinessBlueprint;
  niche: NicheBlueprint;
  heroBadge: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  heroAsset: MediaVaultAsset | null;
  hasServices: boolean;
  hasGallery: boolean;
}

function renderCustomHeroLayout(layout: NonNullable<DeviceDesignOverrides['heroLayout']>, ctx: HeroVariantCtx): string {
  const { templateId, bp, heroBadge, headline, subheadline, primaryCta, heroAsset, hasServices, hasGallery } = ctx;
  const isDark = templateId === 'noir-showcase';
  const accent = isDark ? 'var(--cz-noir-accent)' : templateId === 'modern-studio' ? 'var(--cz-ms-primary)' : 'var(--cz-accent)';
  const surface = isDark ? 'var(--cz-noir-card)' : templateId === 'modern-studio' ? 'var(--cz-ms-card)' : 'var(--cz-surface)';
  const ink = isDark ? 'var(--cz-noir-text)' : templateId === 'modern-studio' ? 'var(--cz-ms-ink)' : 'var(--cz-ink)';
  const muted = isDark ? 'var(--cz-noir-muted)' : templateId === 'modern-studio' ? 'var(--cz-ms-muted)' : 'var(--cz-muted)';
  const border = isDark ? 'rgba(255,255,255,0.12)' : templateId === 'modern-studio' ? 'var(--cz-ms-border)' : 'var(--cz-border)';
  const containerCls = isDark ? 'cz-nr-container' : templateId === 'modern-studio' ? 'cz-ms-container' : 'cz-ea-container';
  const headingCls = isDark ? 'cz-nr-display' : templateId === 'modern-studio' ? 'cz-ms-heading' : 'cz-ea-serif';
  const btnBg = isDark ? accent : templateId === 'modern-studio' ? accent : ink;
  const btnColor = isDark ? '#09090B' : '#FFFFFF';
  const profileName = bp.profile.name;

  if (layout === 'centered') {
    return `<section id="hero" data-cuzmify-type="hero" style="padding:48px 0;">
      <div class="${containerCls}" style="max-width:860px;">
        <div class="cz-hero-text" style="text-align:center;display:flex;flex-direction:column;align-items:center;">
          <span data-cuzmify-field="hero-badge" style="display:inline-block;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};font-weight:700;margin-bottom:14px;">${escapeHtml(heroBadge)}</span>
          <h1 data-cuzmify-field="headline" class="${headingCls} cz-hero-title" style="font-size:clamp(2.1rem,5vw,3.5rem);font-weight:700;line-height:1.1;margin:0 0 16px;color:${ink};max-width:720px;">${escapeHtml(headline)}</h1>
          <p data-cuzmify-field="subheadline" style="font-size:15px;line-height:1.68;color:${muted};margin:0 0 26px;max-width:560px;">${escapeHtml(subheadline)}</p>
          <div class="cz-hero-actions" style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;">
            <a data-cuzmify-field="primary-cta" href="#booking" style="padding:13px 26px;border-radius:999px;background:${btnBg};color:${btnColor};font-weight:700;font-size:13px;text-decoration:none;">${escapeHtml(formatArrowCtaLabel(primaryCta))}</a>
            ${hasServices ? `<a href="#services" style="padding:13px 22px;border-radius:999px;border:1px solid ${border};background:${surface};color:${ink};font-weight:600;font-size:13px;text-decoration:none;">View Rates</a>` : ''}
          </div>
          ${heroAsset ? `<div class="cz-hero-media" style="margin-top:32px;width:100%;max-width:620px;border-radius:22px;overflow:hidden;aspect-ratio:16/10;max-height:420px;border:1px solid ${border};background:${surface};">${renderVaultSlotMedia(heroAsset, { role: 'hero', alt: profileName, style: 'width:100%;height:100%;object-fit:cover;display:block;' })}</div>` : ''}
        </div>
      </div>
    </section>`;
  }

  if (layout === 'full_bleed') {
    return `<section id="hero" data-cuzmify-type="hero" style="position:relative;${heroAsset ? 'min-height:460px;display:flex;align-items:flex-end;' : 'padding:64px 0;'}background:linear-gradient(135deg,#0F172A,#1E293B);overflow:hidden;">
      ${heroAsset ? `${renderVaultSlotMedia(heroAsset, { role: 'hero', alt: profileName, style: 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.48;', heroBackground: true })}<div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(to top,rgba(9,9,11,0.88) 12%,rgba(9,9,11,0.45) 60%,rgba(9,9,11,0.28) 100%);"></div>` : ''}
      <div class="${containerCls} cz-hero-text" style="position:relative;z-index:2;padding-top:72px;padding-bottom:52px;width:100%;">
        <span data-cuzmify-field="hero-badge" style="display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(255,255,255,0.14);color:#FAFAFA;font-size:11px;font-weight:700;margin-bottom:14px;">${escapeHtml(heroBadge)}</span>
        <h1 data-cuzmify-field="headline" class="${headingCls} cz-hero-title" style="font-size:clamp(2.1rem,5vw,3.6rem);font-weight:800;line-height:1.08;margin:0 0 14px;max-width:700px;color:#FAFAFA;">${escapeHtml(headline)}</h1>
        <p data-cuzmify-field="subheadline" style="font-size:15px;color:#E4E4E7;line-height:1.65;margin:0 0 26px;max-width:540px;">${escapeHtml(subheadline)}</p>
        <div class="cz-hero-actions" style="display:flex;flex-wrap:wrap;gap:12px;">
          <a data-cuzmify-field="primary-cta" href="#booking" style="padding:13px 26px;border-radius:12px;background:${accent};color:#FFFFFF;font-weight:700;font-size:13px;text-decoration:none;">${escapeHtml(formatArrowCtaLabel(primaryCta))}</a>
          ${hasGallery ? `<a href="#portfolio" style="padding:13px 22px;border-radius:12px;background:rgba(255,255,255,0.12);color:#FAFAFA;font-weight:700;font-size:13px;text-decoration:none;">View Work</a>` : ''}
        </div>
      </div>
    </section>`;
  }

  if (layout === 'minimal_card') {
    return `<section id="hero" data-cuzmify-type="hero" style="padding:36px 0;">
      <div class="${containerCls}">
        <div class="cz-hero-text" style="background:${surface};border:1px solid ${border};border-radius:24px;padding:30px 24px;">
          <span data-cuzmify-field="hero-badge" style="display:inline-block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${accent};font-weight:700;margin-bottom:10px;">${escapeHtml(heroBadge)}</span>
          <h1 data-cuzmify-field="headline" class="${headingCls} cz-hero-title" style="font-size:clamp(1.85rem,4.5vw,2.9rem);font-weight:800;line-height:1.12;margin:0 0 12px;color:${ink};">${escapeHtml(headline)}</h1>
          <p data-cuzmify-field="subheadline" style="font-size:14px;line-height:1.65;color:${muted};margin:0 0 22px;max-width:600px;">${escapeHtml(subheadline)}</p>
          <div class="cz-hero-actions" style="display:flex;flex-wrap:wrap;gap:10px;">
            <a data-cuzmify-field="primary-cta" href="#booking" style="padding:12px 22px;border-radius:12px;background:${btnBg};color:${btnColor};font-weight:700;font-size:13px;text-decoration:none;">${escapeHtml(formatArrowCtaLabel(primaryCta))}</a>
          </div>
          ${heroAsset ? `<div class="cz-hero-media" style="margin-top:24px;border-radius:18px;overflow:hidden;aspect-ratio:16/9;max-height:360px;background:${surface};border:1px solid ${border};">${renderVaultSlotMedia(heroAsset, { role: 'hero', alt: profileName, style: 'width:100%;height:100%;object-fit:cover;display:block;' })}</div>` : ''}
        </div>
      </div>
    </section>`;
  }

  // 'split' variant
  return `<section id="hero" data-cuzmify-type="hero">
    <div class="${containerCls} cz-ea-hero-grid">
      <div class="cz-hero-text">
        <span data-cuzmify-field="hero-badge" style="display:inline-block;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};font-weight:700;margin-bottom:14px;">${escapeHtml(heroBadge)}</span>
        <h1 data-cuzmify-field="headline" class="${headingCls} cz-hero-title" style="font-size:clamp(2.2rem,5vw,3.6rem);font-weight:700;line-height:1.08;margin:0 0 16px;color:${ink};">${escapeHtml(headline)}</h1>
        <p data-cuzmify-field="subheadline" style="font-size:15px;line-height:1.68;color:${muted};margin:0 0 26px;max-width:480px;">${escapeHtml(subheadline)}</p>
        <div class="cz-hero-actions" style="display:flex;flex-wrap:wrap;gap:12px;">
          <a data-cuzmify-field="primary-cta" href="#booking" style="padding:13px 26px;border-radius:999px;background:${btnBg};color:${btnColor};font-weight:700;font-size:13px;text-decoration:none;">${escapeHtml(formatArrowCtaLabel(primaryCta))}</a>
          ${hasServices ? `<a href="#services" style="padding:13px 22px;border-radius:999px;border:1px solid ${border};background:${surface};color:${ink};font-weight:600;font-size:13px;text-decoration:none;">View Rates</a>` : ''}
        </div>
      </div>
      ${heroAsset ? `<div class="cz-hero-media" style="border-radius:24px;overflow:hidden;aspect-ratio:4/5;max-height:480px;width:100%;border:1px solid ${border};background:${surface};">${renderVaultSlotMedia(heroAsset, { role: 'hero', alt: profileName, style: 'width:100%;height:100%;object-fit:cover;display:block;' })}</div>` : ''}
    </div>
  </section>`;
}

function renderCustomServicesLayout(
  layout: NonNullable<TemplateDesignOverrides['servicesLayout']>,
  params: {
    templateId: TemplateEngineId;
    services: ServiceItem[];
    currencySymbol: string;
    eyebrow: string;
    heading: string;
    itemCta: string;
  }
): string {
  const { templateId, services, currencySymbol, eyebrow, heading, itemCta } = params;
  if (services.length === 0) return '';
  const isDark = templateId === 'noir-showcase';
  const accent = isDark ? 'var(--cz-noir-accent)' : templateId === 'modern-studio' ? 'var(--cz-ms-primary)' : 'var(--cz-accent)';
  const surface = isDark ? 'var(--cz-noir-card)' : templateId === 'modern-studio' ? 'var(--cz-ms-card)' : 'var(--cz-surface)';
  const ink = isDark ? 'var(--cz-noir-text)' : templateId === 'modern-studio' ? 'var(--cz-ms-ink)' : 'var(--cz-ink)';
  const muted = isDark ? 'var(--cz-noir-muted)' : templateId === 'modern-studio' ? 'var(--cz-ms-muted)' : 'var(--cz-muted)';
  const border = isDark ? 'rgba(255,255,255,0.1)' : templateId === 'modern-studio' ? 'var(--cz-ms-border)' : 'var(--cz-border)';
  const containerCls = isDark ? 'cz-nr-container' : templateId === 'modern-studio' ? 'cz-ms-container' : 'cz-ea-container';
  const headingCls = isDark ? 'cz-nr-display' : templateId === 'modern-studio' ? 'cz-ms-heading' : 'cz-ea-serif';

  if (layout === 'compact_menu') {
    return `<section id="services" data-cuzmify-type="services" style="padding:52px 0;border-top:1px solid ${border};">
      <div class="${containerCls}">
        <div style="margin-bottom:24px;">
          <span data-cuzmify-field="services-eyebrow" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};font-weight:700;">${escapeHtml(eyebrow)}</span>
          <h2 data-cuzmify-field="services-heading" class="${headingCls}" style="font-size:clamp(1.6rem,3.5vw,2.25rem);font-weight:700;margin:6px 0 0;">${escapeHtml(heading)}</h2>
        </div>
        <div class="services-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">
          ${services
            .map((srv) => {
              const pText = formatServicePrice(srv, currencySymbol);
              return `<div data-cuzmify-target-id="${escapeHtml(srv.id)}" style="padding:16px 18px;border-radius:14px;border:1px solid ${border};background:${surface};display:flex;align-items:center;justify-content:space-between;gap:12px;">
                <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1;">
                  ${renderServiceSlotMedia(srv, 'width:52px;height:52px;border-radius:10px;object-fit:cover;flex-shrink:0;')}
                  <div style="min-width:0;">
                    <h3 data-cuzmify-field="service-name" style="margin:0;font-size:15px;font-weight:700;color:${ink};">${escapeHtml(srv.name)}</h3>
                    ${srv.description ? `<p data-cuzmify-field="service-description" style="margin:4px 0 0;font-size:12px;color:${muted};line-height:1.45;">${escapeHtml(srv.description)}</p>` : ''}
                  </div>
                </div>
                <a href="#booking" data-cuzmify-field="service-price" data-select-service="${escapeHtml(`${srv.name} (${pText})`)}" style="font-size:13px;font-weight:800;color:${accent};text-decoration:none;white-space:nowrap;">${escapeHtml(pText)}</a>
              </div>`;
            })
            .join('')}
        </div>
      </div>
    </section>`;
  }

  if (layout === 'card_grid') {
    return `<section id="services" data-cuzmify-type="services" style="padding:56px 0;border-top:1px solid ${border};">
      <div class="${containerCls}">
        <div style="margin-bottom:28px;">
          <span data-cuzmify-field="services-eyebrow" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${accent};font-weight:700;">${escapeHtml(eyebrow)}</span>
          <h2 data-cuzmify-field="services-heading" class="${headingCls}" style="font-size:clamp(1.65rem,3.5vw,2.35rem);font-weight:700;margin:6px 0 0;">${escapeHtml(heading)}</h2>
        </div>
        <div class="services-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:18px;">
          ${services
            .map((srv) => {
              const pText = formatServicePrice(srv, currencySymbol);
              return `<div data-cuzmify-target-id="${escapeHtml(srv.id)}" style="background:${surface};border:1px solid ${border};border-radius:18px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;gap:16px;">
                <div>
                  ${srv.imageUrl ? `<div style="border-radius:12px;overflow:hidden;aspect-ratio:16/10;margin-bottom:14px;background:rgba(128,128,128,0.08);">${renderServiceSlotMedia(srv, 'width:100%;height:100%;object-fit:cover;display:block;')}</div>` : ''}
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                    <h3 data-cuzmify-field="service-name" class="${headingCls}" style="margin:0;font-size:1.15rem;font-weight:700;color:${ink};">${escapeHtml(srv.name)}</h3>
                    <span data-cuzmify-field="service-price" style="font-weight:800;font-size:0.95rem;color:${accent};white-space:nowrap;">${escapeHtml(pText)}</span>
                  </div>
                  ${srv.description ? `<p data-cuzmify-field="service-description" style="margin:8px 0 0;font-size:13px;color:${muted};line-height:1.55;">${escapeHtml(srv.description)}</p>` : ''}
                </div>
                <a data-cuzmify-field="service-item-cta" href="#booking" data-select-service="${escapeHtml(`${srv.name} (${pText})`)}" style="display:flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:12px;background:${accent};color:${isDark ? '#09090B' : '#FFFFFF'};font-size:12px;font-weight:700;text-decoration:none;">${escapeHtml(formatArrowCtaLabel(itemCta))}</a>
              </div>`;
            })
            .join('')}
        </div>
      </div>
    </section>`;
  }

  // 'editorial_list'
  return `<section id="services" data-cuzmify-type="services" style="padding:56px 0;border-top:1px solid ${border};">
    <div class="${containerCls}">
      <div style="margin-bottom:32px;">
        <span data-cuzmify-field="services-eyebrow" style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${accent};font-weight:700;">${escapeHtml(eyebrow)}</span>
        <h2 data-cuzmify-field="services-heading" class="${headingCls}" style="font-size:clamp(1.75rem,3.8vw,2.5rem);font-weight:600;margin:8px 0 0;">${escapeHtml(heading)}</h2>
      </div>
      <div class="services-grid" style="display:flex;flex-direction:column;">
        ${services
          .map((srv, idx) => {
            const pText = formatServicePrice(srv, currencySymbol);
            return `<div data-cuzmify-target-id="${escapeHtml(srv.id)}" style="padding:22px 0;border-bottom:1px solid ${border};display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;">
              <div style="display:flex;gap:14px;align-items:flex-start;flex:1 1 250px;">
                <span style="font-size:1.1rem;color:${accent};font-weight:700;min-width:26px;">0${idx + 1}</span>
                ${renderServiceSlotMedia(srv, 'width:64px;height:64px;border-radius:12px;object-fit:cover;flex-shrink:0;')}
                <div>
                  <h3 data-cuzmify-field="service-name" class="${headingCls}" style="font-size:1.25rem;font-weight:700;margin:0;color:${ink};">${escapeHtml(srv.name)}</h3>
                  ${srv.description ? `<p data-cuzmify-field="service-description" style="font-size:13px;color:${muted};margin:5px 0 0;line-height:1.55;">${escapeHtml(srv.description)}</p>` : ''}
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:16px;margin-left:auto;">
                <span data-cuzmify-field="service-price" style="font-weight:700;color:${ink};">${escapeHtml(pText)}</span>
                <a data-cuzmify-field="service-item-cta" href="#booking" data-select-service="${escapeHtml(`${srv.name} (${pText})`)}" style="padding:9px 16px;border-radius:999px;border:1px solid ${border};color:${ink};text-decoration:none;font-size:12px;font-weight:600;white-space:nowrap;">${escapeHtml(itemCta)}</a>
              </div>
            </div>`;
          })
          .join('')}
      </div>
    </div>
  </section>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1: EDITORIAL ATELIER (Warm Ivory, Serif, Numbered Menu, Split Hero)
// ─────────────────────────────────────────────────────────────────────────────
function renderEditorialAtelier(bp: BusinessBlueprint, niche: NicheBlueprint, siteId?: string) {
  const profile = bp.profile;
  const currencySymbol = SUPPORTED_CURRENCIES[profile.currency || 'NGN']?.symbol || '₦';
  const services = (bp.modules?.services?.items || []).filter((s) => s.enabled !== false);
  const vault = (bp.mediaVault || []).filter((m) => Boolean(m.thumbnailUrl || m.url));
  const heroAsset = vault[0] || null;
  const galleryAssets = vault.length > 1 ? vault.slice(1) : vault;
  const igHandle = (profile.instagramHandle || profile.instagram || '').replace(/^@/, '');
  const locationLine = [profile.city, profile.country].filter(Boolean).join(', ');
  const copy = bp.customCopy || {};
  const headline = copy.headline || profile.tagline || `${niche.label}${locationLine ? ` in ${locationLine}` : ''}`;
  const subheadline =
    copy.subheadline ||
    profile.bio ||
    (igHandle ? `Explore selected work from @${igHandle} and check availability directly.` : `Explore selected work and enquire directly below.`);
  const primaryCta = copy.primaryCta || niche.vocabulary.primaryCta;
  const heroBadge = copy.heroBadge || `${niche.shortLabel}${locationLine ? ` • ${locationLine}` : ''}`;
  const serviceItemCta = copy.serviceItemCta || niche.vocabulary.serviceItemCta;
  const activeOv = getActiveDesignOverrides('editorial-atelier', bp);
  const galleryLimit = Math.min(12, Math.max(1, Math.round(activeOv?.galleryLimit || 12)));

  const css = `
    :root, [data-cuzmify-template="editorial-atelier"] { --cz-bg:#FAF7F2; --cz-surface:#FFFFFF; --cz-ink:#1C1917; --cz-muted:#6B635B; --cz-accent:#9A6B4C; --cz-border:#E7E0D6; }
    .cz-ea-root { background-color:#FAF7F2; background-color:var(--cz-bg); color:#1C1917; color:var(--cz-ink); font-family:'Plus Jakarta Sans',system-ui,sans-serif; margin:0; min-height:100vh; }
    .cz-ea-serif { font-family:'Cormorant Garamond',Georgia,serif; }
    .cz-ea-container { max-width:1080px; margin:0 auto; padding:0 20px; box-sizing:border-box; }
    .cz-ea-hero-grid { display:grid; grid-template-columns:1fr; gap:32px; align-items:center; padding-top:36px; padding-bottom:52px; }
    .cz-ea-gallery { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
    @media (min-width:768px) {
      .cz-ea-container { padding:0 40px; }
      .cz-ea-hero-grid { grid-template-columns:1.05fr 0.95fr; gap:56px; padding-top:64px; padding-bottom:80px; }
      .cz-ea-gallery { grid-template-columns:repeat(3,1fr); gap:20px; }
    }
  `;

  const servicesHtml =
    services.length > 0 && isSectionVisible(bp, 'services')
      ? activeOv?.servicesLayout
        ? renderCustomServicesLayout(activeOv.servicesLayout, {
            templateId: 'editorial-atelier',
            services,
            currencySymbol,
            eyebrow: copy.servicesEyebrow || niche.vocabulary.servicesEyebrow,
            heading: copy.servicesHeading || niche.vocabulary.servicesHeading,
            itemCta: serviceItemCta,
          })
        : `<section id="services" data-cuzmify-type="services" style="padding:64px 0;border-top:1px solid var(--cz-border);">
          <div class="cz-ea-container">
            <div style="margin-bottom:36px;">
              <span data-cuzmify-field="services-eyebrow" style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--cz-accent);font-weight:700;">${escapeHtml(copy.servicesEyebrow || niche.vocabulary.servicesEyebrow)}</span>
              <h2 data-cuzmify-field="services-heading" class="cz-ea-serif" style="font-size:clamp(2rem,4vw,2.75rem);font-weight:600;margin:8px 0 0;line-height:1.15;">${escapeHtml(copy.servicesHeading || niche.vocabulary.servicesHeading)}</h2>
            </div>
            <div class="services-grid" style="display:flex;flex-direction:column;">
              ${services
                .map((srv, idx) => {
                  const pText = formatServicePrice(srv, currencySymbol);
                  return `<div data-cuzmify-target-id="${escapeHtml(srv.id)}" style="padding:24px 0;border-bottom:1px solid var(--cz-border);display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;">
                    <div style="display:flex;gap:16px;align-items:flex-start;flex:1 1 260px;">
                      <span class="cz-ea-serif" style="font-size:1.25rem;color:var(--cz-accent);font-style:italic;min-width:28px;">0${idx + 1}</span>
                      ${renderServiceSlotMedia(srv, 'width:64px;height:64px;border-radius:12px;object-fit:cover;flex-shrink:0;')}
                      <div>
                        <h3 data-cuzmify-field="service-name" class="cz-ea-serif" style="font-size:1.45rem;font-weight:600;margin:0;color:var(--cz-ink);">${escapeHtml(srv.name)}</h3>
                        ${srv.description ? `<p data-cuzmify-field="service-description" style="font-size:13px;color:var(--cz-muted);margin:6px 0 0;line-height:1.6;max-width:540px;">${escapeHtml(srv.description)}</p>` : ''}
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:18px;margin-left:auto;">
                      <span data-cuzmify-field="service-price" style="font-size:1.05rem;font-weight:700;color:var(--cz-ink);">${escapeHtml(pText)}</span>
                      <a data-cuzmify-field="service-item-cta" href="#booking" data-select-service="${escapeHtml(`${srv.name} (${pText})`)}" style="padding:9px 16px;border-radius:999px;border:1px solid var(--cz-ink);color:var(--cz-ink);text-decoration:none;font-size:12px;font-weight:600;white-space:nowrap;">${escapeHtml(serviceItemCta)}</a>
                    </div>
                  </div>`;
                })
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const galleryHtml =
    galleryAssets.length > 0 && isSectionVisible(bp, 'portfolio')
      ? `<section id="portfolio" data-cuzmify-type="gallery" style="padding:64px 0;border-top:1px solid var(--cz-border);">
          <div class="cz-ea-container">
            <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;margin-bottom:32px;">
              <div>
                <span data-cuzmify-field="portfolio-eyebrow" style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--cz-accent);font-weight:700;">${escapeHtml(copy.portfolioEyebrow || niche.vocabulary.portfolioEyebrow)}</span>
                <h2 class="cz-ea-serif" data-cuzmify-field="portfolio-headline" style="font-size:clamp(2rem,4vw,2.75rem);font-weight:600;margin:8px 0 0;">${escapeHtml(copy.portfolioHeading || niche.vocabulary.portfolioHeading)}</h2>
              </div>
              ${igHandle ? `<a href="https://instagram.com/${escapeHtml(igHandle)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;font-weight:600;color:var(--cz-accent);text-decoration:none;">@${escapeHtml(igHandle)} ↗</a>` : ''}
            </div>
            <div class="cz-ea-gallery gallery-grid">
              ${galleryAssets
                .slice(0, galleryLimit)
                .map(
                  (m) => `<div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;background:#EFEAE1;">
                    ${renderVaultSlotMedia(m, { role: 'gallery', alt: m.name, style: 'width:100%;height:100%;object-fit:cover;display:block;', lazy: true })}
                  </div>`
                )
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const heroSectionHtml = isSectionVisible(bp, 'hero')
    ? activeOv?.heroLayout
      ? renderCustomHeroLayout(activeOv.heroLayout, {
          templateId: 'editorial-atelier',
          bp,
          niche,
          heroBadge,
          headline,
          subheadline,
          primaryCta,
          heroAsset,
          hasServices: services.length > 0 && isSectionVisible(bp, 'services'),
          hasGallery: galleryAssets.length > 0 && isSectionVisible(bp, 'portfolio'),
        })
      : `<section id="hero" data-cuzmify-type="hero">
      <div class="cz-ea-container cz-ea-hero-grid">
        <div class="cz-hero-text">
          <span data-cuzmify-field="hero-badge" style="display:inline-block;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:var(--cz-accent);font-weight:700;margin-bottom:14px;">
            ${escapeHtml(heroBadge)}
          </span>
          <h1 data-cuzmify-field="headline" class="cz-ea-serif cz-hero-title" style="font-size:clamp(2.35rem,5.5vw,3.85rem);font-weight:600;line-height:1.08;margin:0 0 18px;color:var(--cz-ink);">
            ${escapeHtml(headline)}
          </h1>
          <p data-cuzmify-field="subheadline" style="font-size:15px;line-height:1.7;color:var(--cz-muted);margin:0 0 28px;max-width:480px;">
            ${escapeHtml(subheadline)}
          </p>
          <div class="cz-hero-actions" style="display:flex;flex-wrap:wrap;gap:12px;">
            <a data-cuzmify-field="primary-cta" href="#booking" style="padding:14px 26px;border-radius:999px;background:var(--cz-ink);color:var(--cz-bg);font-weight:600;font-size:13px;text-decoration:none;">${escapeHtml(formatArrowCtaLabel(primaryCta))}</a>
            ${services.length > 0 && isSectionVisible(bp, 'services') ? `<a href="#services" style="padding:14px 22px;border-radius:999px;border:1px solid var(--cz-border);background:var(--cz-surface);color:var(--cz-ink);font-weight:600;font-size:13px;text-decoration:none;">View Rates</a>` : ''}
          </div>
        </div>
        ${
          heroAsset
            ? `<div class="cz-hero-media" style="border-radius:220px 220px 24px 24px;overflow:hidden;aspect-ratio:4/5;max-height:520px;width:100%;box-shadow:0 24px 60px rgba(28,25,23,0.12);background:#EFEAE1;">
                ${renderVaultSlotMedia(heroAsset, { role: 'hero', alt: profile.name, style: 'width:100%;height:100%;object-fit:cover;display:block;' })}
              </div>`
            : `<div class="cz-hero-media" style="border-radius:28px;padding:40px 28px;background:var(--cz-surface);border:1px solid var(--cz-border);text-align:center;">
                <span class="cz-ea-serif" style="font-size:1.75rem;font-style:italic;color:var(--cz-accent);display:block;margin-bottom:8px;">${escapeHtml(profile.name)}</span>
                <p style="font-size:13px;color:var(--cz-muted);margin:0;">Connect Instagram or upload photos to showcase your hero work here.</p>
              </div>`
        }
      </div>
    </section>`
    : '';

  const bookingSectionHtml = isSectionVisible(bp, 'booking')
    ? `<section id="booking" data-cuzmify-type="booking" style="padding:64px 0 88px;border-top:1px solid var(--cz-border);">
      <div class="cz-ea-container" style="max-width:640px;">
        <div style="background:var(--cz-surface);border:1px solid var(--cz-border);border-radius:24px;padding:32px 24px;box-shadow:0 16px 48px rgba(28,25,23,0.06);">
          <div style="text-align:center;margin-bottom:24px;">
            <span data-cuzmify-field="enquiry-eyebrow" style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--cz-accent);font-weight:700;">${escapeHtml(copy.enquiryEyebrow || niche.vocabulary.enquiryEyebrow)}</span>
            <h2 data-cuzmify-field="enquiry-heading" class="cz-ea-serif" style="font-size:clamp(1.85rem,4vw,2.35rem);font-weight:600;margin:8px 0;">${escapeHtml(copy.enquiryHeading || niche.vocabulary.enquiryHeading)}</h2>
            <p data-cuzmify-field="enquiry-subheading" style="font-size:13px;color:var(--cz-muted);margin:0;">${escapeHtml(copy.enquirySubheading || niche.vocabulary.enquirySubheading)}</p>
          </div>
          ${renderSharedEnquiryForm(bp, niche, services, currencySymbol, siteId, false)}
        </div>
      </div>
    </section>`
    : '';

  const bodySections = assembleOrderedSections(
    {
      hero: heroSectionHtml,
      services: servicesHtml,
      portfolio: galleryHtml,
      custom: renderSharedCustomSections(bp, 'editorial-atelier'),
      testimonials: renderSharedTestimonialsSection(bp, false),
      faq: renderSharedFaqSection(bp, false),
      booking: bookingSectionHtml,
    },
    activeOv?.sectionOrder,
    ['hero', 'services', 'portfolio', 'custom', 'testimonials', 'faq', 'booking']
  );

  const navbarHtml = isSectionVisible(bp, 'navbar')
    ? `<nav data-cuzmify-type="navbar" style="border-bottom:1px solid var(--cz-border, #E7E0D6);background-color:var(--cz-bg, #FAF7F2);backdrop-filter:blur(10px);position:sticky;top:0;z-index:30;">
      <div class="cz-ea-container" style="height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <span data-cuzmify-field="business-name" class="brand-name cz-ea-serif" style="font-size:1.3rem;font-weight:700;letter-spacing:0.02em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(profile.name)}</span>
        <a data-cuzmify-field="primary-cta" href="#booking" style="padding:9px 18px;border-radius:999px;background-color:var(--cz-ink, #1C1917);color:var(--cz-bg, #FAF7F2);font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0;">${escapeHtml(primaryCta)}</a>
      </div>
    </nav>`
    : '';

  const html = `<div class="cz-ea-root" data-cuzmify-template="editorial-atelier" style="background-color:var(--cz-bg, #FAF7F2);color:var(--cz-ink, #1C1917);min-height:100vh;">
    ${navbarHtml}

    ${bodySections}
  </div>`;

  return { css, html };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2: NOIR SHOWCASE (Cinema Dark, Full-Bleed Cover, Portfolio-First)
// ─────────────────────────────────────────────────────────────────────────────
function renderNoirShowcase(bp: BusinessBlueprint, niche: NicheBlueprint, siteId?: string) {
  const profile = bp.profile;
  const currencySymbol = SUPPORTED_CURRENCIES[profile.currency || 'NGN']?.symbol || '₦';
  const services = (bp.modules?.services?.items || []).filter((s) => s.enabled !== false);
  const vault = (bp.mediaVault || []).filter((m) => Boolean(m.thumbnailUrl || m.url));
  const heroAsset = vault[0] || null;
  const galleryAssets = vault.length > 1 ? vault.slice(1) : vault;
  const igHandle = (profile.instagramHandle || profile.instagram || '').replace(/^@/, '');
  const locationLine = [profile.city, profile.country].filter(Boolean).join(', ');
  const copy = bp.customCopy || {};
  const headline = copy.headline || profile.tagline || profile.name;
  const subheadline =
    copy.subheadline ||
    profile.bio ||
    `${niche.label}${locationLine ? ` • ${locationLine}` : ''}`;
  const primaryCta = copy.primaryCta || niche.vocabulary.primaryCta;
  const heroBadge = copy.heroBadge || `${niche.shortLabel}${locationLine ? ` • ${locationLine}` : ''}`;
  const serviceItemCta = copy.serviceItemCta || niche.vocabulary.serviceItemCta;
  const activeOv = getActiveDesignOverrides('noir-showcase', bp);
  const galleryLimit = Math.min(12, Math.max(1, Math.round(activeOv?.galleryLimit || 12)));

  const css = `
    :root, [data-cuzmify-template="noir-showcase"] { --cz-noir-bg:#09090B; --cz-noir-card:#141418; --cz-noir-text:#FAFAFA; --cz-noir-muted:#A1A1AA; --cz-noir-accent:#F59E0B; }
    .cz-nr-root { background-color:#09090B; background-color:var(--cz-noir-bg); color:#FAFAFA; color:var(--cz-noir-text); font-family:'DM Sans',system-ui,sans-serif; margin:0; min-height:100vh; }
    .cz-nr-display { font-family:'Outfit',system-ui,sans-serif; letter-spacing:-0.02em; }
    .cz-nr-container { max-width:1160px; margin:0 auto; padding:0 20px; box-sizing:border-box; }
    .cz-nr-gallery { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
    .cz-nr-services { display:grid; grid-template-columns:1fr; gap:16px; }
    @media (min-width:768px) {
      .cz-nr-container { padding:0 40px; }
      .cz-nr-gallery { grid-template-columns:repeat(3,1fr); gap:16px; }
      .cz-nr-services { grid-template-columns:repeat(2,1fr); gap:20px; }
    }
  `;

  // Noir puts the visual portfolio FIRST right after the dramatic cover hero
  const galleryHtml =
    galleryAssets.length > 0 && isSectionVisible(bp, 'portfolio')
      ? `<section id="portfolio" data-cuzmify-type="gallery" style="padding:56px 0;">
          <div class="cz-nr-container">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:10px;">
              <h2 class="cz-nr-display" data-cuzmify-field="portfolio-headline" style="font-size:clamp(1.35rem,3vw,1.85rem);font-weight:700;margin:0;letter-spacing:-0.02em;">${escapeHtml(copy.portfolioHeading || niche.vocabulary.portfolioHeading)}</h2>
              ${igHandle ? `<a href="https://instagram.com/${escapeHtml(igHandle)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:var(--cz-noir-accent);text-decoration:none;font-weight:700;">@${escapeHtml(igHandle)} ↗</a>` : ''}
            </div>
            <div class="cz-nr-gallery gallery-grid">
              ${galleryAssets
                .slice(0, galleryLimit)
                .map(
                  (m) => `<div style="border-radius:12px;overflow:hidden;aspect-ratio:3/4;background:#18181B;">
                    ${renderVaultSlotMedia(m, { role: 'gallery', alt: m.name, style: 'width:100%;height:100%;object-fit:cover;display:block;', lazy: true })}
                  </div>`
                )
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const servicesHtml =
    services.length > 0 && isSectionVisible(bp, 'services')
      ? activeOv?.servicesLayout
        ? renderCustomServicesLayout(activeOv.servicesLayout, {
            templateId: 'noir-showcase',
            services,
            currencySymbol,
            eyebrow: copy.servicesEyebrow || niche.vocabulary.servicesEyebrow,
            heading: copy.servicesHeading || niche.vocabulary.servicesHeading,
            itemCta: serviceItemCta,
          })
        : `<section id="services" data-cuzmify-type="services" style="padding:56px 0;border-top:1px solid rgba(255,255,255,0.08);">
          <div class="cz-nr-container">
            <div style="margin-bottom:28px;">
              <span data-cuzmify-field="services-eyebrow" style="font-size:11px;text-transform:uppercase;letter-spacing:0.16em;color:var(--cz-noir-accent);font-weight:700;">${escapeHtml(copy.servicesEyebrow || niche.vocabulary.servicesEyebrow)}</span>
              <h2 data-cuzmify-field="services-heading" class="cz-nr-display" style="font-size:clamp(1.6rem,3.5vw,2.25rem);font-weight:700;margin:8px 0 0;">${escapeHtml(copy.servicesHeading || niche.vocabulary.servicesHeading)}</h2>
            </div>
            <div class="cz-nr-services services-grid">
              ${services
                .map((srv) => {
                  const pText = formatServicePrice(srv, currencySymbol);
                  return `<div data-cuzmify-target-id="${escapeHtml(srv.id)}" style="background:var(--cz-noir-card);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;display:flex;flex-direction:column;justify-content:space-between;gap:18px;">
                    <div>
                      ${srv.imageUrl ? `<div style="border-radius:12px;overflow:hidden;height:180px;margin-bottom:16px;">${renderServiceSlotMedia(srv, 'width:100%;height:100%;object-fit:cover;display:block;')}</div>` : ''}
                      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
                        <h3 data-cuzmify-field="service-name" class="cz-nr-display" style="font-size:1.15rem;font-weight:700;margin:0;color:var(--cz-noir-text);">${escapeHtml(srv.name)}</h3>
                        <span data-cuzmify-field="service-price" style="font-size:1rem;font-weight:700;color:var(--cz-noir-accent);white-space:nowrap;">${escapeHtml(pText)}</span>
                      </div>
                      ${srv.description ? `<p data-cuzmify-field="service-description" style="font-size:13px;color:var(--cz-noir-muted);line-height:1.65;margin:10px 0 0;">${escapeHtml(srv.description)}</p>` : ''}
                    </div>
                    <a data-cuzmify-field="service-item-cta" href="#booking" data-select-service="${escapeHtml(`${srv.name} (${pText})`)}" style="display:inline-flex;align-items:center;justify-content:center;padding:11px 16px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);color:var(--cz-noir-text);font-size:12px;font-weight:700;text-decoration:none;">${escapeHtml(formatArrowCtaLabel(serviceItemCta))}</a>
                  </div>`;
                })
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const heroSectionHtml = isSectionVisible(bp, 'hero')
    ? activeOv?.heroLayout
      ? renderCustomHeroLayout(activeOv.heroLayout, {
          templateId: 'noir-showcase',
          bp,
          niche,
          heroBadge,
          headline,
          subheadline,
          primaryCta,
          heroAsset,
          hasServices: services.length > 0 && isSectionVisible(bp, 'services'),
          hasGallery: galleryAssets.length > 0 && isSectionVisible(bp, 'portfolio'),
        })
      : `<section id="hero" data-cuzmify-type="hero" style="position:relative;${heroAsset ? 'min-height:440px;display:flex;align-items:flex-end;' : ''}background:radial-gradient(ellipse at 50% 0%,#1E2430 0%,var(--cz-noir-bg) 72%);overflow:hidden;border-bottom:1px solid rgba(255,255,255,0.08);">
      ${
        heroAsset
          ? `${renderVaultSlotMedia(heroAsset, { role: 'hero', alt: profile.name, style: 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.46;', heroBackground: true })}
             <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(to top,var(--cz-noir-bg) 14%,rgba(9,9,11,0.55) 60%,rgba(9,9,11,0.35) 100%);"></div>`
          : ''
      }
      <div class="cz-nr-container cz-hero-text" style="position:relative;z-index:2;padding:${heroAsset ? '88px 20px 52px' : '56px 20px 56px'};width:100%;">
        <span data-cuzmify-field="hero-badge" style="display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(245,158,11,0.16);border:1px solid rgba(245,158,11,0.35);color:var(--cz-noir-accent);font-size:11px;font-weight:700;margin-bottom:16px;">
          ${escapeHtml(heroBadge)}
        </span>
        <h1 data-cuzmify-field="headline" class="cz-nr-display cz-hero-title" style="font-size:clamp(2.1rem,5vw,3.5rem);font-weight:800;line-height:1.08;margin:0 0 14px;max-width:720px;color:var(--cz-noir-text);">
          ${escapeHtml(headline)}
        </h1>
        <p data-cuzmify-field="subheadline" style="font-size:15px;color:#D4D4D8;line-height:1.65;margin:0 0 26px;max-width:540px;">
          ${escapeHtml(subheadline)}
        </p>
        <div class="cz-hero-actions" style="display:flex;flex-wrap:wrap;gap:12px;">
          <a data-cuzmify-field="primary-cta" href="#booking" style="display:inline-flex;align-items:center;padding:13px 24px;border-radius:12px;background:var(--cz-noir-accent);color:#09090B;font-weight:800;font-size:13px;text-decoration:none;">${escapeHtml(formatArrowCtaLabel(primaryCta))}</a>
          ${galleryAssets.length > 0 && isSectionVisible(bp, 'portfolio') ? `<a href="#portfolio" style="display:inline-flex;align-items:center;padding:13px 22px;border-radius:12px;background:rgba(255,255,255,0.1);color:var(--cz-noir-text);font-weight:700;font-size:13px;text-decoration:none;backdrop-filter:blur(8px);">View Work</a>` : ''}
        </div>
      </div>
    </section>`
    : '';

  const bookingSectionHtml = isSectionVisible(bp, 'booking')
    ? `<section id="booking" data-cuzmify-type="booking" style="padding:56px 0 88px;border-top:1px solid rgba(255,255,255,0.08);">
      <div class="cz-nr-container" style="max-width:640px;">
        <div style="background:var(--cz-noir-card);border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:32px 24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <span data-cuzmify-field="enquiry-eyebrow" style="font-size:11px;text-transform:uppercase;letter-spacing:0.16em;color:var(--cz-noir-accent);font-weight:700;">${escapeHtml(copy.enquiryEyebrow || niche.vocabulary.enquiryEyebrow)}</span>
            <h2 data-cuzmify-field="enquiry-heading" class="cz-nr-display" style="font-size:clamp(1.6rem,3.5vw,2.1rem);font-weight:700;margin:8px 0;">${escapeHtml(copy.enquiryHeading || niche.vocabulary.enquiryHeading)}</h2>
            <p data-cuzmify-field="enquiry-subheading" style="font-size:13px;color:var(--cz-noir-muted);margin:0;">${escapeHtml(copy.enquirySubheading || niche.vocabulary.enquirySubheading)}</p>
          </div>
          ${renderSharedEnquiryForm(bp, niche, services, currencySymbol, siteId, true)}
        </div>
      </div>
    </section>`
    : '';

  const bodySections = assembleOrderedSections(
    {
      hero: heroSectionHtml,
      portfolio: galleryHtml,
      services: servicesHtml,
      custom: renderSharedCustomSections(bp, 'noir-showcase'),
      testimonials: renderSharedTestimonialsSection(bp, true),
      faq: renderSharedFaqSection(bp, true),
      booking: bookingSectionHtml,
    },
    activeOv?.sectionOrder,
    ['hero', 'portfolio', 'services', 'custom', 'testimonials', 'faq', 'booking']
  );

  const navbarHtml = isSectionVisible(bp, 'navbar')
    ? `<nav data-cuzmify-type="navbar" style="position:sticky;top:0;z-index:30;background-color:var(--cz-noir-bg, #09090B);color:var(--cz-noir-text, #FAFAFA);border-bottom:1px solid rgba(255,255,255,0.1);">
      <div class="cz-nr-container" style="height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <span data-cuzmify-field="business-name" class="brand-name cz-nr-display" style="font-size:1.05rem;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:var(--cz-noir-text, #FAFAFA);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(profile.name)}</span>
        <a data-cuzmify-field="primary-cta" href="#booking" style="padding:9px 18px;border-radius:10px;background-color:var(--cz-noir-accent, #F59E0B);color:#09090B;font-size:12px;font-weight:800;text-decoration:none;white-space:nowrap;flex-shrink:0;">${escapeHtml(primaryCta)}</a>
      </div>
    </nav>`
    : '';

  const html = `<div class="cz-nr-root" data-cuzmify-template="noir-showcase" style="background-color:var(--cz-noir-bg, #09090B);color:var(--cz-noir-text, #FAFAFA);min-height:100vh;">
    ${navbarHtml}

    ${bodySections}
  </div>`;

  return { css, html };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3: MODERN STUDIO (Crisp Bento Cards, Square IG Grid, Sticky Mobile CTA)
// ─────────────────────────────────────────────────────────────────────────────
function renderModernStudio(bp: BusinessBlueprint, niche: NicheBlueprint, siteId?: string) {
  const profile = bp.profile;
  const currencySymbol = SUPPORTED_CURRENCIES[profile.currency || 'NGN']?.symbol || '₦';
  const services = (bp.modules?.services?.items || []).filter((s) => s.enabled !== false);
  const vault = (bp.mediaVault || []).filter((m) => Boolean(m.thumbnailUrl || m.url));
  const heroAsset = vault[0] || null;
  const stripAssets = vault.slice(0, 3);
  const igHandle = (profile.instagramHandle || profile.instagram || '').replace(/^@/, '');
  const locationLine = [profile.city, profile.country].filter(Boolean).join(', ');
  const copy = bp.customCopy || {};
  const headline = copy.headline || profile.tagline || `${profile.name} — ${niche.shortLabel}`;
  const subheadline =
    copy.subheadline ||
    profile.bio ||
    (locationLine ? `Serving clients in ${locationLine}. View packages and book directly below.` : `View our packages, recent work, and check availability directly below.`);
  const primaryCta = copy.primaryCta || niche.vocabulary.primaryCta;
  const heroBadge = copy.heroBadge || `${niche.label}${locationLine ? ` • ${locationLine}` : ''}`;
  const serviceItemCta = copy.serviceItemCta || niche.vocabulary.serviceItemCta;
  const waPhone = (bp.modules?.whatsapp?.phoneNumber || profile.whatsapp || '').replace(/[^\d]/g, '');
  const activeOv = getActiveDesignOverrides('modern-studio', bp);
  const galleryLimit = Math.min(12, Math.max(1, Math.round(activeOv?.galleryLimit || 12)));

  const css = `
    :root, [data-cuzmify-template="modern-studio"] { --cz-ms-bg:#F8FAFC; --cz-ms-card:#FFFFFF; --cz-ms-primary:#0D5771; --cz-ms-ink:#0F172A; --cz-ms-muted:#64748B; --cz-ms-border:#E2E8F0; }
    .cz-ms-root { background-color:#F8FAFC; background-color:var(--cz-ms-bg); color:#0F172A; color:var(--cz-ms-ink); font-family:'Inter',system-ui,sans-serif; margin:0; min-height:100vh; }
    .cz-ms-heading { font-family:'Outfit',system-ui,sans-serif; }
    .cz-ms-container { max-width:1080px; margin:0 auto; padding:0 18px; box-sizing:border-box; }
    .cz-ms-services { display:grid; grid-template-columns:1fr; gap:16px; }
    .cz-ms-gallery { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
    @media (min-width:768px) {
      .cz-ms-container { padding:0 36px; }
      .cz-ms-services { grid-template-columns:repeat(3,1fr); gap:20px; }
      .cz-ms-gallery { grid-template-columns:repeat(4,1fr); gap:14px; }
    }
  `;

  const stripHtml =
    stripAssets.length > 0
      ? `<div style="display:grid;grid-template-columns:repeat(${stripAssets.length},1fr);gap:10px;margin-top:28px;">
          ${stripAssets
            .map(
              (a, idx) => `<div class="cz-hero-media" style="border-radius:16px;overflow:hidden;aspect-ratio:4/3;background:#E2E8F0;">
                ${renderVaultSlotMedia(a, { role: idx === 0 ? 'hero' : 'gallery', alt: a.name, style: 'width:100%;height:100%;object-fit:cover;display:block;' })}
              </div>`
            )
            .join('')}
        </div>`
      : '';

  const servicesHtml =
    services.length > 0 && isSectionVisible(bp, 'services')
      ? activeOv?.servicesLayout
        ? renderCustomServicesLayout(activeOv.servicesLayout, {
            templateId: 'modern-studio',
            services,
            currencySymbol,
            eyebrow: copy.servicesEyebrow || niche.vocabulary.servicesEyebrow,
            heading: copy.servicesHeading || niche.vocabulary.servicesHeading,
            itemCta: serviceItemCta,
          })
        : `<section id="services" data-cuzmify-type="services" style="padding:48px 0;">
          <div class="cz-ms-container">
            <div style="margin-bottom:24px;">
              <span data-cuzmify-field="services-eyebrow" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--cz-ms-primary);">${escapeHtml(copy.servicesEyebrow || niche.vocabulary.servicesEyebrow)}</span>
              <h2 data-cuzmify-field="services-heading" class="cz-ms-heading" style="font-size:clamp(1.5rem,3vw,2rem);font-weight:800;margin:6px 0 0;">${escapeHtml(copy.servicesHeading || niche.vocabulary.servicesHeading)}</h2>
            </div>
            <div class="cz-ms-services services-grid">
              ${services
                .map((srv) => {
                  const pText = formatServicePrice(srv, currencySymbol);
                  return `<div data-cuzmify-target-id="${escapeHtml(srv.id)}" style="background:var(--cz-ms-card);border:1px solid var(--cz-ms-border);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 16px rgba(15,23,42,0.04);">
                    <div>
                      ${srv.imageUrl ? `<div style="aspect-ratio:16/10;background:#F1F5F9;overflow:hidden;">${renderServiceSlotMedia(srv, 'width:100%;height:100%;object-fit:cover;display:block;')}</div>` : ''}
                      <div style="padding:20px 20px 12px;">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                          <h3 data-cuzmify-field="service-name" class="cz-ms-heading" style="font-size:1.05rem;font-weight:700;margin:0;color:var(--cz-ms-ink);">${escapeHtml(srv.name)}</h3>
                          <span data-cuzmify-field="service-price" style="font-size:0.95rem;font-weight:800;color:#059669;background:#ECFDF5;padding:4px 10px;border-radius:999px;white-space:nowrap;">${escapeHtml(pText)}</span>
                        </div>
                        ${srv.description ? `<p data-cuzmify-field="service-description" style="font-size:13px;color:var(--cz-ms-muted);line-height:1.6;margin:10px 0 0;">${escapeHtml(srv.description)}</p>` : ''}
                      </div>
                    </div>
                    <div style="padding:0 20px 20px;">
                      <a data-cuzmify-field="service-item-cta" href="#booking" data-select-service="${escapeHtml(`${srv.name} (${pText})`)}" style="display:flex;align-items:center;justify-content:center;width:100%;padding:11px 14px;border-radius:12px;background:var(--cz-ms-primary);color:#FFFFFF;font-size:12px;font-weight:700;text-decoration:none;box-sizing:border-box;">${escapeHtml(serviceItemCta)}</a>
                    </div>
                  </div>`;
                })
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const galleryHtml =
    vault.length > 0 && isSectionVisible(bp, 'portfolio')
      ? `<section id="portfolio" data-cuzmify-type="gallery" style="padding:48px 0;">
          <div class="cz-ms-container">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
              <h2 class="cz-ms-heading" data-cuzmify-field="portfolio-headline" style="font-size:clamp(1.4rem,3vw,1.85rem);font-weight:800;margin:0;">${escapeHtml(copy.portfolioHeading || niche.vocabulary.portfolioHeading)}</h2>
              ${igHandle ? `<a href="https://instagram.com/${escapeHtml(igHandle)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;font-weight:700;color:var(--cz-ms-primary);text-decoration:none;">Follow @${escapeHtml(igHandle)} ↗</a>` : ''}
            </div>
            <div class="cz-ms-gallery gallery-grid">
              ${vault
                .slice(0, galleryLimit)
                .map(
                  (m) => `<div style="border-radius:14px;overflow:hidden;aspect-ratio:1/1;background:#E2E8F0;">
                    ${renderVaultSlotMedia(m, { role: 'gallery', alt: m.name, style: 'width:100%;height:100%;object-fit:cover;display:block;', lazy: true })}
                  </div>`
                )
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const heroSectionHtml = isSectionVisible(bp, 'hero')
    ? activeOv?.heroLayout
      ? renderCustomHeroLayout(activeOv.heroLayout, {
          templateId: 'modern-studio',
          bp,
          niche,
          heroBadge,
          headline,
          subheadline,
          primaryCta,
          heroAsset,
          hasServices: services.length > 0 && isSectionVisible(bp, 'services'),
          hasGallery: vault.length > 0 && isSectionVisible(bp, 'portfolio'),
        })
      : `<section id="hero" data-cuzmify-type="hero" style="padding:36px 0 24px;">
      <div class="cz-ms-container">
        <div class="cz-hero-text" style="background:var(--cz-ms-card);border:1px solid var(--cz-ms-border);border-radius:24px;padding:28px 22px;box-shadow:0 8px 30px rgba(13,87,113,0.05);">
          <span data-cuzmify-field="hero-badge" style="display:inline-block;padding:4px 10px;border-radius:999px;background:rgba(13,87,113,0.08);color:var(--cz-ms-primary);font-size:11px;font-weight:700;margin-bottom:12px;">
            ${escapeHtml(heroBadge)}
          </span>
          <h1 data-cuzmify-field="headline" class="cz-ms-heading cz-hero-title" style="font-size:clamp(1.75rem,4.2vw,2.75rem);font-weight:800;line-height:1.15;margin:0 0 12px;">
            ${escapeHtml(headline)}
          </h1>
          <p data-cuzmify-field="subheadline" style="font-size:14px;color:var(--cz-ms-muted);line-height:1.65;margin:0 0 22px;max-width:600px;">
            ${escapeHtml(subheadline)}
          </p>
          <div class="cz-hero-actions" style="display:flex;flex-wrap:wrap;gap:10px;">
            <a data-cuzmify-field="primary-cta" href="#booking" style="padding:13px 22px;border-radius:12px;background:var(--cz-ms-primary);color:#FFFFFF;font-weight:700;font-size:13px;text-decoration:none;">${escapeHtml(formatArrowCtaLabel(primaryCta))}</a>
            ${waPhone ? `<a href="${escapeHtml(buildWhatsAppDirectHref(waPhone, `Hello ${profile.name}, I found your website and have a quick question.`))}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:13px 20px;border-radius:12px;background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;font-weight:700;font-size:13px;text-decoration:none;">${WHATSAPP_BRAND_SVG}<span>Chat on WhatsApp</span></a>` : ''}
          </div>
          ${stripHtml}
        </div>
      </div>
    </section>`
    : '';

  const bookingSectionHtml = isSectionVisible(bp, 'booking')
    ? `<section id="booking" data-cuzmify-type="booking" style="padding:40px 0 64px;">
      <div class="cz-ms-container" style="max-width:620px;">
        <div style="background:var(--cz-ms-card);border:1px solid var(--cz-ms-border);border-radius:24px;padding:28px 22px;box-shadow:0 12px 36px rgba(15,23,42,0.06);">
          <div style="text-align:center;margin-bottom:22px;">
            <span data-cuzmify-field="enquiry-eyebrow" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--cz-ms-primary);">${escapeHtml(copy.enquiryEyebrow || niche.vocabulary.enquiryEyebrow)}</span>
            <h2 data-cuzmify-field="enquiry-heading" class="cz-ms-heading" style="font-size:clamp(1.45rem,3.5vw,1.95rem);font-weight:800;margin:6px 0;">${escapeHtml(copy.enquiryHeading || niche.vocabulary.enquiryHeading)}</h2>
            <p data-cuzmify-field="enquiry-subheading" style="font-size:13px;color:var(--cz-ms-muted);margin:0;">${escapeHtml(copy.enquirySubheading || niche.vocabulary.enquirySubheading)}</p>
          </div>
          ${renderSharedEnquiryForm(bp, niche, services, currencySymbol, siteId, false)}
        </div>
      </div>
    </section>`
    : '';

  const bodySections = assembleOrderedSections(
    {
      hero: heroSectionHtml,
      services: servicesHtml,
      portfolio: galleryHtml,
      custom: renderSharedCustomSections(bp, 'modern-studio'),
      testimonials: renderSharedTestimonialsSection(bp, false),
      faq: renderSharedFaqSection(bp, false),
      booking: bookingSectionHtml,
    },
    activeOv?.sectionOrder,
    ['hero', 'services', 'portfolio', 'custom', 'testimonials', 'faq', 'booking']
  );

  const navbarHtml = isSectionVisible(bp, 'navbar')
    ? `<nav data-cuzmify-type="navbar" style="background-color:var(--cz-ms-card, #FFFFFF);border-bottom:1px solid var(--cz-ms-border, #E2E8F0);position:sticky;top:0;z-index:30;">
      <div class="cz-ms-container" style="height:60px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
          <span style="width:8px;height:8px;border-radius:999px;background:#10B981;flex-shrink:0;"></span>
          <span data-cuzmify-field="business-name" class="brand-name cz-ms-heading" style="font-size:1.05rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(profile.name)}</span>
        </div>
        <a data-cuzmify-field="primary-cta" href="#booking" style="padding:8px 16px;border-radius:10px;background-color:var(--cz-ms-primary, #0D5771);color:#FFFFFF;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;">${escapeHtml(primaryCta)}</a>
      </div>
    </nav>`
    : '';

  const html = `<div class="cz-ms-root" data-cuzmify-template="modern-studio" style="background-color:var(--cz-ms-bg, #F8FAFC);color:var(--cz-ms-ink, #0F172A);min-height:100vh;">
    ${navbarHtml}

    ${bodySections}
  </div>`;

  return { css, html };
}

export interface RenderedTemplateOutput {
  templateId: TemplateEngineId;
  nicheId: string;
  css: string;
  html: string;
  fullHtml: string;
  googleFontsUrl: string;
}

function applyTemplateSlotInjections(
  rootHtml: string,
  bp: BusinessBlueprint,
  templateId: TemplateEngineId
): string {
  const inj = getActiveSlotInjections(templateId, bp);
  if (!inj) return rootHtml;

  let out = rootHtml;

  const topBar = renderSlotHtml(bp, 'top_bar', 4000, templateId);
  if (topBar) {
    out = out.replace(
      /(<div\b[^>]*data-cuzmify-template="[^"]*"[^>]*>)/i,
      `$1\n  <div data-cuzmify-slot="top_bar">${topBar}</div>`
    );
  }

  const navActions = renderSlotHtml(bp, 'nav_actions', 3000, templateId);
  if (navActions) {
    out = out.replace(
      /(<nav\b[^>]*data-cuzmify-type="navbar"[\s\S]*?)(<\/div>\s*<\/nav>)/i,
      `$1<span data-cuzmify-slot="nav_actions" style="display:inline-flex;align-items:center;gap:8px;flex-shrink:0;">${navActions}</span>$2`
    );
  }

  const heroCtaAfter = renderSlotHtml(bp, 'hero_cta_after', 3000, templateId);
  if (heroCtaAfter) {
    out = out.replace(
      /(<div\b[^>]*class="[^"]*cz-hero-actions[^"]*"[^>]*>[\s\S]*?)(<\/div>)/i,
      `$1<span data-cuzmify-slot="hero_cta_after" style="display:inline-flex;align-items:center;gap:8px;">${heroCtaAfter}</span>$2`
    );
  }

  const wrapSection = (secId: string, aboveSlot: BlueprintSlotId, belowSlot: BlueprintSlotId) => {
    const above = renderSlotHtml(bp, aboveSlot, 4000, templateId);
    const below = renderSlotHtml(bp, belowSlot, 4000, templateId);
    if (!above && !below) return;
    const re = new RegExp(`(<section\\b[^>]*\\bid="${secId}"[^>]*>[\\s\\S]*?<\\/section>)`, 'i');
    out = out.replace(
      re,
      `${above ? `<div data-cuzmify-slot="${aboveSlot}">${above}</div>` : ''}$1${below ? `<div data-cuzmify-slot="${belowSlot}">${below}</div>` : ''}`
    );
  };

  wrapSection('hero', 'hero_above', 'hero_below');
  wrapSection('services', 'services_above', 'services_below');
  wrapSection('booking', 'booking_above', 'booking_below');

  const footer = renderSlotHtml(bp, 'footer', 6000, templateId);
  if (footer) {
    const lastDivIdx = out.lastIndexOf('</div>');
    if (lastDivIdx !== -1) {
      out = `${out.slice(0, lastDivIdx)}\n  <footer data-cuzmify-type="footer" data-cuzmify-slot="footer">${footer}</footer>\n${out.slice(lastDivIdx)}`;
    }
  }

  return out;
}

/**
 * Renders a `BusinessBlueprint` through the chosen `TemplateEngineId` with 0% data loss.
 */
export function renderTemplateEngine(
  templateIdInput: string | undefined | null,
  blueprint: BusinessBlueprint,
  options?: { siteId?: string }
): RenderedTemplateOutput {
  const templateId = resolveTemplateEngineId(templateIdInput || blueprint.templateId);
  const niche = resolveNicheBlueprint(blueprint.nicheId || blueprint.profile?.nicheId || blueprint.profile?.category);
  const meta = TEMPLATE_ENGINES[templateId];

  const rendered =
    templateId === 'noir-showcase'
      ? renderNoirShowcase(blueprint, niche, options?.siteId)
      : templateId === 'modern-studio'
        ? renderModernStudio(blueprint, niche, options?.siteId)
        : renderEditorialAtelier(blueprint, niche, options?.siteId);

  const overrideCss = buildDesignOverrideCss(templateId, blueprint);
  const combinedCss = [rendered.css, overrideCss].filter(Boolean).join('\n');
  const injectedHtml = applyTemplateSlotInjections(rendered.html, blueprint, templateId);

  return {
    templateId,
    nicheId: niche.id,
    css: combinedCss,
    html: injectedHtml,
    fullHtml: `<style>${combinedCss}</style>\n${injectedHtml}`,
    googleFontsUrl: meta.googleFontsUrl,
  };
}
