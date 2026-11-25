import {
  BLUEPRINT_INJECTION_SLOTS,
  type BusinessBlueprint,
  type DeviceDesignOverrides,
} from '@/core/blueprint-schema';
import {
  TEMPLATE_ENGINES,
  renderTemplateEngine,
  resolveTemplateEngineId,
  type TemplateEngineId,
} from '@/core/template-engines';

export interface SiteAccountMeta {
  id?: string;
  name?: string;
  subdomain?: string | null;
  status?: string;
  customDomain?: string | null;
  liveUrl?: string | null;
  plan?: string | null;
  enquiriesCount?: number;
  accountSites?: Array<{
    id: string;
    name: string;
    subdomain: string | null;
    status: string;
    templateId: string;
    updatedAt?: string;
  }>;
}

export interface QaFinding {
  severity: 'critical' | 'warning' | 'info';
  area: 'contrast' | 'mobile_layout' | 'media' | 'copy' | 'conversion' | 'launch' | 'seo';
  message: string;
  suggestedFix?: string;
}

function parseHexToRgb(hex: string): [number, number, number] | null {
  const clean = (hex || '').trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function computeHexContrast(hexA: string, hexB: string): number | null {
  const rgbA = parseHexToRgb(hexA);
  const rgbB = parseHexToRgb(hexB);
  if (!rgbA || !rgbB) return null;
  const l1 = relativeLuminance(rgbA);
  const l2 = relativeLuminance(rgbB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

function getNativeTemplatePalette(templateId: TemplateEngineId) {
  if (templateId === 'noir-showcase') {
    return {
      backgroundColor: '#09090B',
      surfaceColor: '#141418',
      textColor: '#FAFAFA',
      accentColor: '#F59E0B',
      ctaTextColor: '#09090B',
    };
  }
  if (templateId === 'modern-studio') {
    return {
      backgroundColor: '#F8FAFC',
      surfaceColor: '#FFFFFF',
      textColor: '#0F172A',
      accentColor: '#0D5771',
      ctaTextColor: '#FFFFFF',
    };
  }
  return {
    backgroundColor: '#FAF7F2',
    surfaceColor: '#FFFFFF',
    textColor: '#1C1917',
    accentColor: '#9A6B4C',
    ctaTextColor: '#FFFFFF',
  };
}

function mergeViewportConfig(
  templateId: TemplateEngineId,
  base: Record<string, any>,
  slice?: DeviceDesignOverrides
) {
  const defaults = {
    pagePaddingX: 'normal',
    sectionSpacing: 'normal',
    heroLayout: templateId === 'editorial-atelier' ? 'split' : templateId === 'noir-showcase' ? 'full_bleed' : 'minimal_card',
    heroTextAlign: 'left',
    heroImageAspect: templateId === 'editorial-atelier' ? 'portrait' : templateId === 'modern-studio' ? 'landscape' : 'wide',
    heroImageShape: templateId === 'editorial-atelier' ? 'arch' : 'rounded',
    heroImageFit: 'cover',
    galleryColumns: templateId === 'modern-studio' ? 4 : 3,
    servicesColumns: templateId === 'editorial-atelier' ? 1 : templateId === 'noir-showcase' ? 2 : 3,
    fontScale: 'normal',
    hideHeroImage: false,
  };

  const merged: Record<string, any> = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (base?.[key] !== undefined) merged[key] = base[key];
    if ((slice as any)?.[key] !== undefined) merged[key] = (slice as any)[key];
  }
  if (base?.heroImageMaxHeight !== undefined) merged.heroImageMaxHeight = base.heroImageMaxHeight;
  if (slice?.heroImageMaxHeight !== undefined) merged.heroImageMaxHeight = slice.heroImageMaxHeight;
  return merged;
}

export function inspectRenderedSite(bp: BusinessBlueprint, siteMeta?: SiteAccountMeta) {
  const templateId = resolveTemplateEngineId(bp.templateId);
  const templateMeta = TEMPLATE_ENGINES[templateId];
  const rendered = renderTemplateEngine(templateId, bp, { siteId: siteMeta?.id });

  const activeOv = bp.templateDesignOverrides
    ? bp.templateDesignOverrides[templateId] || {}
    : bp.designOverrides || {};

  const nativePalette = getNativeTemplatePalette(templateId);
  const effectivePalette = {
    backgroundColor: activeOv.backgroundColor || nativePalette.backgroundColor,
    surfaceColor: activeOv.surfaceColor || nativePalette.surfaceColor,
    textColor: activeOv.textColor || nativePalette.textColor,
    accentColor: activeOv.accentColor || nativePalette.accentColor,
    buttonRadius: activeOv.buttonRadius || (templateId === 'editorial-atelier' ? 'pill' : 'rounded'),
    fontMood: activeOv.fontMood || (templateId === 'editorial-atelier' ? 'editorial_serif' : 'bold_display'),
  };

  const contrastAudit = {
    textOnBackground: computeHexContrast(effectivePalette.backgroundColor, effectivePalette.textColor),
    textOnSurface: computeHexContrast(effectivePalette.surfaceColor, effectivePalette.textColor),
    accentOnBackground: computeHexContrast(effectivePalette.backgroundColor, effectivePalette.accentColor),
    ctaButtonTextContrast: computeHexContrast(
      effectivePalette.accentColor,
      templateId === 'noir-showcase' ? '#09090B' : '#FFFFFF'
    ),
  };

  const effectiveDesign = {
    all: mergeViewportConfig(templateId, activeOv),
    mobile: mergeViewportConfig(templateId, activeOv, activeOv.responsive?.mobile),
    tablet: mergeViewportConfig(templateId, activeOv, activeOv.responsive?.tablet),
    desktop: mergeViewportConfig(templateId, activeOv, activeOv.responsive?.desktop),
    servicesLayout:
      activeOv.servicesLayout ||
      (templateId === 'editorial-atelier' ? 'editorial_list' : 'card_grid'),
    sectionOrder:
      activeOv.sectionOrder ||
      (templateId === 'noir-showcase'
        ? ['hero', 'portfolio', 'services', 'custom', 'testimonials', 'faq', 'booking']
        : ['hero', 'services', 'portfolio', 'custom', 'testimonials', 'faq', 'booking']),
  };

  // Parse actual top-to-bottom rendered sections from compiled HTML
  const renderedSections: Array<{ id: string; type: string; charLength: number }> = [];
  const secRegex = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
  let m: RegExpExecArray | null;
  while ((m = secRegex.exec(rendered.html)) !== null) {
    const attrs = m[1] || '';
    const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
    const typeMatch = attrs.match(/\bdata-cuzmify-type=["']([^"']+)["']/i);
    renderedSections.push({
      id: idMatch ? idMatch[1] : 'unknown',
      type: typeMatch ? typeMatch[1] : 'section',
      charLength: m[0].length,
    });
  }

  const vault = (bp.mediaVault || []).filter((item) => Boolean(item.thumbnailUrl || item.url));
  const services = (bp.modules?.services?.items || []).filter((s) => s.enabled !== false);
  const products = (bp.modules?.products?.items || []).filter((p) => p.enabled !== false);
  const vis = bp.sectionVisibility || {};

  const skippedSections: Array<{ section: string; reason: string }> = [];
  if (vis.hero === false) skippedSections.push({ section: 'hero', reason: 'Hidden by sectionVisibility.hero = false' });
  if (vis.services === false) {
    skippedSections.push({ section: 'services', reason: 'Hidden by sectionVisibility.services = false' });
  } else if (services.length === 0) {
    skippedSections.push({ section: 'services', reason: '0 enabled services in catalog' });
  }
  if (vis.portfolio === false) {
    skippedSections.push({ section: 'portfolio', reason: 'Hidden by sectionVisibility.portfolio = false' });
  } else if (vault.length === 0) {
    skippedSections.push({ section: 'portfolio', reason: '0 images in Media Vault' });
  }
  if ((bp.testimonials?.length || 0) === 0 || vis.testimonials === false) {
    skippedSections.push({
      section: 'testimonials',
      reason: vis.testimonials === false ? 'Hidden by sectionVisibility' : 'No vendor-supplied testimonials yet',
    });
  }
  if ((bp.faqs?.length || 0) === 0 || vis.faq === false) {
    skippedSections.push({
      section: 'faq',
      reason: vis.faq === false ? 'Hidden by sectionVisibility' : 'No FAQs added yet',
    });
  }
  if ((bp.customSections?.length || 0) === 0 || vis.custom === false) {
    skippedSections.push({
      section: 'custom',
      reason: vis.custom === false ? 'Hidden by sectionVisibility' : 'No custom sections added yet',
    });
  }
  if (vis.booking === false) skippedSections.push({ section: 'booking', reason: 'Hidden by sectionVisibility.booking = false' });

  const mediaInventory = vault.slice(0, 15).map((asset, idx) => {
    const urlStr = asset.url || '';
    const isDataUrl = urlStr.startsWith('data:');
    const approxKb = isDataUrl ? Math.round((urlStr.length * 0.75) / 1024) : null;
    const w = asset.width;
    const h = asset.height;
    const orientation =
      w && h ? (w === h ? 'square' : w > h ? 'landscape' : 'portrait') : 'unknown';
    return {
      photoNumber: idx + 1,
      id: asset.id,
      name: asset.name,
      type: asset.type,
      source: asset.source,
      width: w ?? null,
      height: h ?? null,
      orientation,
      isDataUrl,
      approxKb,
      assignedRole: idx === 0 ? 'hero_cover' : 'gallery_item',
    };
  });

  const headline = bp.customCopy?.headline || bp.profile.tagline || '';
  const subheadline = bp.customCopy?.subheadline || bp.profile.bio || '';
  const waPhone = (bp.modules?.whatsapp?.phoneNumber || bp.profile.whatsapp || '').replace(/[^\d]/g, '');

  const qaFindings: QaFinding[] = [];
  if (contrastAudit.textOnBackground !== null && contrastAudit.textOnBackground < 4.5) {
    qaFindings.push({
      severity: 'critical',
      area: 'contrast',
      message: `Text (${effectivePalette.textColor}) on background (${effectivePalette.backgroundColor}) has low contrast (${contrastAudit.textOnBackground}:1).`,
      suggestedFix: 'Adjust textColor or backgroundColor via customize_template_design to achieve >= 4.5:1.',
    });
  }
  if (contrastAudit.textOnSurface !== null && contrastAudit.textOnSurface < 4.5) {
    qaFindings.push({
      severity: 'critical',
      area: 'contrast',
      message: `Card text (${effectivePalette.textColor}) on surface (${effectivePalette.surfaceColor}) has low contrast (${contrastAudit.textOnSurface}:1).`,
      suggestedFix: 'Adjust surfaceColor or textColor via customize_template_design.',
    });
  }
  if (effectiveDesign.mobile.servicesColumns > 1 && services.length > 0) {
    qaFindings.push({
      severity: 'warning',
      area: 'mobile_layout',
      message: `Mobile servicesColumns is ${effectiveDesign.mobile.servicesColumns}, which may feel cramped on phones.`,
      suggestedFix: 'Call customize_template_design with device: "mobile" and servicesColumns: 1.',
    });
  }
  if (effectiveDesign.mobile.galleryColumns > 2 && vault.length > 1) {
    qaFindings.push({
      severity: 'warning',
      area: 'mobile_layout',
      message: `Mobile galleryColumns is ${effectiveDesign.mobile.galleryColumns}; thumbnails may be tiny on narrow screens.`,
      suggestedFix: 'Set galleryColumns: 1 or 2 with device: "mobile".',
    });
  }
  if (headline.length > 68) {
    qaFindings.push({
      severity: 'warning',
      area: 'copy',
      message: `Hero headline is ${headline.length} chars; consider tightening under 60 chars or setting fontScale: "compact" on mobile.`,
    });
  }
  if (vault.length === 0) {
    qaFindings.push({
      severity: 'info',
      area: 'media',
      message: 'No uploaded photos yet — Hero shows empty studio placeholder until user uploads or syncs Instagram.',
    });
  } else if (
    mediaInventory[0] &&
    (mediaInventory[0].orientation === 'square' || /icon|logo|meta/i.test(mediaInventory[0].name || '')) &&
    effectiveDesign.mobile.heroImageFit !== 'contain'
  ) {
    qaFindings.push({
      severity: 'warning',
      area: 'media',
      message: `Hero asset "${mediaInventory[0].name}" looks like a square icon/logo with heroImageFit="cover", which can crop or blow up on mobile.`,
      suggestedFix: 'Set heroImageFit: "contain", heroImageAspect: "square", heroImageMaxHeight: 240 on mobile.',
    });
  }
  if (!waPhone) {
    qaFindings.push({
      severity: 'warning',
      area: 'conversion',
      message: 'WhatsApp booking number is not configured yet; enquiry form works but instant WhatsApp handoff is disabled.',
    });
  }
  if (services.length > 0 && services.every((s) => !s.price || s.price <= 0)) {
    qaFindings.push({
      severity: 'info',
      area: 'conversion',
      message: 'All listed services are currently "Custom Quote" without fixed Naira/currency rates.',
    });
  }
  if (siteMeta?.status !== 'live') {
    qaFindings.push({
      severity: 'info',
      area: 'launch',
      message: 'Site is still in draft mode (not yet published to live public URL).',
    });
  }

  // SEO Audit
  const seoCfg = bp.seo || {};
  const effectiveSeoTitle =
    seoCfg.metaTitle?.trim() ||
    `${bp.profile.name}${bp.profile.city ? ` in ${bp.profile.city}` : ''} — Official Portfolio & Bookings`;
  const effectiveSeoDesc =
    seoCfg.metaDescription?.trim() || headline || subheadline || '';
  const hasKeywords = Array.isArray(seoCfg.keywords) && seoCfg.keywords.length > 0;
  const hasPublicOgImg = Boolean(
    (seoCfg.ogImageUrl && seoCfg.ogImageUrl.startsWith('http')) ||
      (vault[0]?.thumbnailUrl || vault[0]?.url || '').startsWith('http')
  );
  let seoScore = 40;
  if (effectiveSeoTitle.length >= 20 && effectiveSeoTitle.length <= 65) seoScore += 15;
  if (effectiveSeoDesc.length >= 50 && effectiveSeoDesc.length <= 165) seoScore += 15;
  if (hasKeywords) seoScore += 10;
  if (seoCfg.schemaType) seoScore += 10;
  if (seoCfg.areaServed || bp.profile.city) seoScore += 5;
  if (hasPublicOgImg) seoScore += 5;
  if (seoCfg.noIndex) seoScore = Math.max(0, seoScore - 30);

  if (!seoCfg.metaDescription && effectiveSeoDesc.length < 50) {
    qaFindings.push({
      severity: 'info',
      area: 'seo',
      message: 'Meta description is short or using fallback; configure_seo can boost Google search click-through.',
    });
  }
  if (!hasKeywords) {
    qaFindings.push({
      severity: 'info',
      area: 'seo',
      message: 'No target SEO keywords configured yet (configure_seo -> keywords).',
    });
  }

  const seoAudit = {
    seoScore: Math.min(100, seoScore),
    effectiveTitle: effectiveSeoTitle,
    titleChars: effectiveSeoTitle.length,
    effectiveDescription: effectiveSeoDesc,
    descriptionChars: effectiveSeoDesc.length,
    keywords: seoCfg.keywords || [],
    schemaType: seoCfg.schemaType || 'LocalBusiness',
    canonicalUrl: seoCfg.canonicalUrl || null,
    hasOgImage: hasPublicOgImg,
    indexable: !seoCfg.noIndex,
    openingHours: seoCfg.openingHours || null,
    areaServed: seoCfg.areaServed || bp.profile.city || null,
  };

  const activeInjections = Object.entries(bp.injections || {})
    .filter(([, val]) => typeof val === 'string' && val.trim().length > 0)
    .map(([slot, val]) => ({ slot, chars: String(val).length }));

  return {
    account: {
      siteId: siteMeta?.id || null,
      status: siteMeta?.status || 'draft',
      subdomain: siteMeta?.subdomain || null,
      customDomain: siteMeta?.customDomain || null,
      liveUrl: siteMeta?.liveUrl || (siteMeta?.subdomain ? `/s/${siteMeta.subdomain}` : null),
      plan: siteMeta?.plan || 'free',
      enquiriesCount: siteMeta?.enquiriesCount ?? null,
      ...(siteMeta?.accountSites ? { accountSites: siteMeta.accountSites } : {}),
    },
    template: {
      id: templateId,
      name: templateMeta.name,
      tagline: templateMeta.tagline,
      vibe: templateMeta.vibe,
      googleFontsUrl: rendered.googleFontsUrl,
    },
    effectivePalette,
    contrastAudit,
    effectiveDesign,
    renderedSections,
    skippedSections,
    copyMetrics: {
      businessName: bp.profile.name,
      headline,
      headlineChars: headline.length,
      subheadline,
      subheadlineChars: subheadline.length,
      primaryCta: bp.customCopy?.primaryCta || 'Default Niche CTA',
      customCopyKeys: Object.keys(bp.customCopy || {}),
    },
    mediaInventory,
    seoAudit,
    activeInjections,
    availableSlots: [...BLUEPRINT_INJECTION_SLOTS],
    qaFindings,
    renderedHtmlBytes: rendered.html.length,
    renderedCssBytes: rendered.css.length,
    rendered,
  };
}
