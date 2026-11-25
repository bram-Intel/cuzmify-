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
  type BusinessBlueprint,
  type MediaVaultAsset,
  type ServiceItem,
} from './blueprint-schema';
import { resolveNicheBlueprint, type NicheBlueprint } from './niche-blueprints';

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
      'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@600;700;800&display=swap',
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

function getMediaDisplayUrl(asset: MediaVaultAsset): string {
  return asset.thumbnailUrl || asset.url;
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
          <textarea name="${f.name}" rows="3" placeholder="${escapeHtml(f.placeholder)}" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${inputColor};font-size:14px;font-family:inherit;box-sizing:border-box;resize:vertical;"></textarea>
        </div>`;
      }
      return `<div class="cz-field">
        <label style="display:block;font-size:11px;font-weight:600;color:${labelColor};margin-bottom:6px;">${escapeHtml(f.label)}${f.required ? ' *' : ''}</label>
        <input type="${f.type}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${escapeHtml(f.placeholder)}" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${inputColor};font-size:14px;font-family:inherit;box-sizing:border-box;"/>
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
        <input type="text" name="clientName" required placeholder="Full name" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${inputColor};font-size:14px;font-family:inherit;box-sizing:border-box;"/>
      </div>
      <div class="cz-field">
        <label style="display:block;font-size:11px;font-weight:600;color:${labelColor};margin-bottom:6px;">Your Phone / WhatsApp *</label>
        <input type="tel" name="clientPhone" required placeholder="e.g. 0803 000 0000" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${inputColor};font-size:14px;font-family:inherit;box-sizing:border-box;"/>
      </div>
    </div>

    <div class="cz-field">
      <label style="display:block;font-size:11px;font-weight:600;color:${labelColor};margin-bottom:6px;">Service / Package</label>
      <select name="serviceName" data-cuzmify-type="service-select" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid ${inputBorder};background:${inputBg};color:${inputColor};font-size:14px;font-family:inherit;box-sizing:border-box;">
        ${serviceOptionsHtml}
      </select>
    </div>

    ${dynamicFieldsHtml}

    <button
      type="submit"
      class="cz-submit-btn"
      style="margin-top:6px;width:100%;padding:15px 20px;border-radius:14px;border:none;background:#25D366;color:#FFFFFF;font-weight:700;font-size:15px;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 8px 24px rgba(37,211,102,0.25);"
    >
      <span>${waPhone ? `${escapeHtml(niche.vocabulary.primaryCta)} via WhatsApp →` : `Send Enquiry →`}</span>
    </button>
    <p data-cuzmify-enquiry-feedback="true" style="display:none;font-size:12px;text-align:center;margin:4px 0 0;color:#10B981;font-weight:600;"></p>
  </form>`;
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
  const headline = bp.customCopy?.headline || profile.tagline || `${niche.label}${locationLine ? ` in ${locationLine}` : ''}`;
  const subheadline =
    bp.customCopy?.subheadline ||
    profile.bio ||
    (igHandle ? `Explore selected work from @${igHandle} and check availability directly.` : `Explore selected work and enquire directly below.`);

  const css = `
    :root { --cz-bg:#FAF7F2; --cz-surface:#FFFFFF; --cz-ink:#1C1917; --cz-muted:#6B635B; --cz-accent:#9A6B4C; --cz-border:#E7E0D6; }
    .cz-ea-root { background:var(--cz-bg); color:var(--cz-ink); font-family:'Plus Jakarta Sans',system-ui,sans-serif; margin:0; }
    .cz-ea-serif { font-family:'Cormorant Garamond',Georgia,serif; }
    .cz-ea-container { max-width:1080px; margin:0 auto; padding:0 20px; box-sizing:border-box; }
    .cz-ea-hero-grid { display:grid; grid-template-columns:1fr; gap:32px; align-items:center; padding:40px 0 56px; }
    .cz-ea-gallery { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
    @media (min-width:768px) {
      .cz-ea-container { padding:0 40px; }
      .cz-ea-hero-grid { grid-template-columns:1.05fr 0.95fr; gap:56px; padding:64px 0 80px; }
      .cz-ea-gallery { grid-template-columns:repeat(3,1fr); gap:20px; }
    }
  `;

  const servicesHtml =
    services.length > 0
      ? `<section id="services" data-cuzmify-type="services" style="padding:64px 0;border-top:1px solid var(--cz-border);">
          <div class="cz-ea-container">
            <div style="margin-bottom:36px;">
              <span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--cz-accent);font-weight:700;">${escapeHtml(niche.vocabulary.servicesEyebrow)}</span>
              <h2 class="cz-ea-serif" style="font-size:clamp(2rem,4vw,2.75rem);font-weight:600;margin:8px 0 0;line-height:1.15;">${escapeHtml(niche.vocabulary.servicesHeading)}</h2>
            </div>
            <div class="services-grid" style="display:flex;flex-direction:column;">
              ${services
                .map((srv, idx) => {
                  const pText = formatServicePrice(srv, currencySymbol);
                  return `<div data-cuzmify-target-id="${escapeHtml(srv.id)}" style="padding:24px 0;border-bottom:1px solid var(--cz-border);display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;">
                    <div style="display:flex;gap:16px;align-items:flex-start;flex:1 1 260px;">
                      <span class="cz-ea-serif" style="font-size:1.25rem;color:var(--cz-accent);font-style:italic;min-width:28px;">0${idx + 1}</span>
                      ${srv.imageUrl ? `<img src="${escapeHtml(srv.imageUrl)}" alt="${escapeHtml(srv.name)}" loading="lazy" style="width:64px;height:64px;border-radius:12px;object-fit:cover;flex-shrink:0;"/>` : ''}
                      <div>
                        <h3 data-cuzmify-field="service-name" class="cz-ea-serif" style="font-size:1.45rem;font-weight:600;margin:0;color:var(--cz-ink);">${escapeHtml(srv.name)}</h3>
                        ${srv.description ? `<p style="font-size:13px;color:var(--cz-muted);margin:6px 0 0;line-height:1.6;max-width:540px;">${escapeHtml(srv.description)}</p>` : ''}
                      </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:18px;margin-left:auto;">
                      <span data-cuzmify-field="service-price" style="font-size:1.05rem;font-weight:700;color:var(--cz-ink);">${escapeHtml(pText)}</span>
                      <a href="#booking" data-select-service="${escapeHtml(`${srv.name} (${pText})`)}" style="padding:9px 16px;border-radius:999px;border:1px solid var(--cz-ink);color:var(--cz-ink);text-decoration:none;font-size:12px;font-weight:600;white-space:nowrap;">${escapeHtml(niche.vocabulary.serviceItemCta)}</a>
                    </div>
                  </div>`;
                })
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const galleryHtml =
    galleryAssets.length > 0
      ? `<section id="portfolio" data-cuzmify-type="gallery" style="padding:64px 0;border-top:1px solid var(--cz-border);">
          <div class="cz-ea-container">
            <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;margin-bottom:32px;">
              <div>
                <span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--cz-accent);font-weight:700;">${escapeHtml(niche.vocabulary.portfolioEyebrow)}</span>
                <h2 class="cz-ea-serif" data-cuzmify-field="portfolio-headline" style="font-size:clamp(2rem,4vw,2.75rem);font-weight:600;margin:8px 0 0;">${escapeHtml(niche.vocabulary.portfolioHeading)}</h2>
              </div>
              ${igHandle ? `<a href="https://instagram.com/${escapeHtml(igHandle)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;font-weight:600;color:var(--cz-accent);text-decoration:none;">@${escapeHtml(igHandle)} ↗</a>` : ''}
            </div>
            <div class="cz-ea-gallery gallery-grid">
              ${galleryAssets
                .slice(0, 12)
                .map(
                  (m) => `<div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;background:#EFEAE1;">
                    <img src="${escapeHtml(getMediaDisplayUrl(m))}" alt="${escapeHtml(m.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"/>
                  </div>`
                )
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const html = `<div class="cz-ea-root" data-cuzmify-template="editorial-atelier">
    <nav data-cuzmify-type="navbar" style="border-bottom:1px solid var(--cz-border);background:rgba(250,247,242,0.92);backdrop-filter:blur(10px);position:sticky;top:0;z-index:30;">
      <div class="cz-ea-container" style="height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <span data-cuzmify-field="business-name" class="brand-name cz-ea-serif" style="font-size:1.35rem;font-weight:700;letter-spacing:0.03em;">${escapeHtml(profile.name)}</span>
        <a href="#booking" style="padding:9px 18px;border-radius:999px;background:var(--cz-ink);color:#FAF7F2;font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;">${escapeHtml(niche.vocabulary.primaryCta)}</a>
      </div>
    </nav>

    <section id="hero" data-cuzmify-type="hero">
      <div class="cz-ea-container cz-ea-hero-grid">
        <div>
          <span style="display:inline-block;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:var(--cz-accent);font-weight:700;margin-bottom:14px;">
            ${escapeHtml(niche.shortLabel)}${locationLine ? ` • ${escapeHtml(locationLine)}` : ''}
          </span>
          <h1 data-cuzmify-field="headline" class="cz-ea-serif" style="font-size:clamp(2.35rem,5.5vw,3.85rem);font-weight:600;line-height:1.08;margin:0 0 18px;color:var(--cz-ink);">
            ${escapeHtml(headline)}
          </h1>
          <p data-cuzmify-field="subheadline" style="font-size:15px;line-height:1.7;color:var(--cz-muted);margin:0 0 28px;max-width:480px;">
            ${escapeHtml(subheadline)}
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:12px;">
            <a href="#booking" style="padding:14px 26px;border-radius:999px;background:var(--cz-ink);color:#FAF7F2;font-weight:600;font-size:13px;text-decoration:none;">${escapeHtml(niche.vocabulary.primaryCta)} →</a>
            ${services.length > 0 ? `<a href="#services" style="padding:14px 22px;border-radius:999px;border:1px solid var(--cz-border);background:#FFFFFF;color:var(--cz-ink);font-weight:600;font-size:13px;text-decoration:none;">View Rates</a>` : ''}
          </div>
        </div>
        ${
          heroAsset
            ? `<div style="border-radius:220px 220px 24px 24px;overflow:hidden;aspect-ratio:4/5;max-height:520px;width:100%;box-shadow:0 24px 60px rgba(28,25,23,0.12);background:#EFEAE1;">
                <img src="${escapeHtml(getMediaDisplayUrl(heroAsset))}" alt="${escapeHtml(profile.name)}" style="width:100%;height:100%;object-fit:cover;display:block;"/>
              </div>`
            : `<div style="border-radius:28px;padding:40px 28px;background:#FFFFFF;border:1px solid var(--cz-border);text-align:center;">
                <span class="cz-ea-serif" style="font-size:1.75rem;font-style:italic;color:var(--cz-accent);display:block;margin-bottom:8px;">${escapeHtml(profile.name)}</span>
                <p style="font-size:13px;color:var(--cz-muted);margin:0;">Connect Instagram or upload photos to showcase your hero work here.</p>
              </div>`
        }
      </div>
    </section>

    ${servicesHtml}
    ${galleryHtml}

    <section id="booking" data-cuzmify-type="booking" style="padding:64px 0 88px;border-top:1px solid var(--cz-border);">
      <div class="cz-ea-container" style="max-width:640px;">
        <div style="background:#FFFFFF;border:1px solid var(--cz-border);border-radius:24px;padding:32px 24px;box-shadow:0 16px 48px rgba(28,25,23,0.06);">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--cz-accent);font-weight:700;">${escapeHtml(niche.vocabulary.enquiryEyebrow)}</span>
            <h2 class="cz-ea-serif" style="font-size:clamp(1.85rem,4vw,2.35rem);font-weight:600;margin:8px 0;">${escapeHtml(niche.vocabulary.enquiryHeading)}</h2>
            <p style="font-size:13px;color:var(--cz-muted);margin:0;">${escapeHtml(niche.vocabulary.enquirySubheading)}</p>
          </div>
          ${renderSharedEnquiryForm(bp, niche, services, currencySymbol, siteId, false)}
        </div>
      </div>
    </section>
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
  const headline = bp.customCopy?.headline || profile.tagline || profile.name;
  const subheadline =
    bp.customCopy?.subheadline ||
    profile.bio ||
    `${niche.label}${locationLine ? ` • ${locationLine}` : ''}`;

  const css = `
    :root { --cz-noir-bg:#09090B; --cz-noir-card:#141418; --cz-noir-text:#FAFAFA; --cz-noir-muted:#A1A1AA; --cz-noir-accent:#F59E0B; }
    .cz-nr-root { background:var(--cz-noir-bg); color:var(--cz-noir-text); font-family:'DM Sans',system-ui,sans-serif; margin:0; }
    .cz-nr-display { font-family:'Syne',system-ui,sans-serif; }
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
    galleryAssets.length > 0
      ? `<section id="portfolio" data-cuzmify-type="gallery" style="padding:56px 0;">
          <div class="cz-nr-container">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:10px;">
              <h2 class="cz-nr-display" data-cuzmify-field="portfolio-headline" style="font-size:clamp(1.35rem,3vw,1.85rem);font-weight:700;margin:0;letter-spacing:-0.02em;">${escapeHtml(niche.vocabulary.portfolioHeading)}</h2>
              ${igHandle ? `<a href="https://instagram.com/${escapeHtml(igHandle)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;color:var(--cz-noir-accent);text-decoration:none;font-weight:700;">@${escapeHtml(igHandle)} ↗</a>` : ''}
            </div>
            <div class="cz-nr-gallery gallery-grid">
              ${galleryAssets
                .slice(0, 12)
                .map(
                  (m) => `<div style="border-radius:12px;overflow:hidden;aspect-ratio:3/4;background:#18181B;">
                    <img src="${escapeHtml(getMediaDisplayUrl(m))}" alt="${escapeHtml(m.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"/>
                  </div>`
                )
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const servicesHtml =
    services.length > 0
      ? `<section id="services" data-cuzmify-type="services" style="padding:56px 0;border-top:1px solid rgba(255,255,255,0.08);">
          <div class="cz-nr-container">
            <div style="margin-bottom:28px;">
              <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.16em;color:var(--cz-noir-accent);font-weight:700;">${escapeHtml(niche.vocabulary.servicesEyebrow)}</span>
              <h2 class="cz-nr-display" style="font-size:clamp(1.6rem,3.5vw,2.25rem);font-weight:700;margin:8px 0 0;">${escapeHtml(niche.vocabulary.servicesHeading)}</h2>
            </div>
            <div class="cz-nr-services services-grid">
              ${services
                .map((srv) => {
                  const pText = formatServicePrice(srv, currencySymbol);
                  return `<div data-cuzmify-target-id="${escapeHtml(srv.id)}" style="background:var(--cz-noir-card);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:24px;display:flex;flex-direction:column;justify-content:space-between;gap:18px;">
                    <div>
                      ${srv.imageUrl ? `<div style="border-radius:12px;overflow:hidden;height:180px;margin-bottom:16px;"><img src="${escapeHtml(srv.imageUrl)}" alt="${escapeHtml(srv.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"/></div>` : ''}
                      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
                        <h3 data-cuzmify-field="service-name" class="cz-nr-display" style="font-size:1.15rem;font-weight:700;margin:0;color:#FAFAFA;">${escapeHtml(srv.name)}</h3>
                        <span data-cuzmify-field="service-price" style="font-size:1rem;font-weight:700;color:var(--cz-noir-accent);white-space:nowrap;">${escapeHtml(pText)}</span>
                      </div>
                      ${srv.description ? `<p style="font-size:13px;color:var(--cz-noir-muted);line-height:1.65;margin:10px 0 0;">${escapeHtml(srv.description)}</p>` : ''}
                    </div>
                    <a href="#booking" data-select-service="${escapeHtml(`${srv.name} (${pText})`)}" style="display:inline-flex;align-items:center;justify-content:center;padding:11px 16px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);color:#FAFAFA;font-size:12px;font-weight:700;text-decoration:none;">${escapeHtml(niche.vocabulary.serviceItemCta)} →</a>
                  </div>`;
                })
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const html = `<div class="cz-nr-root" data-cuzmify-template="noir-showcase">
    <nav data-cuzmify-type="navbar" style="position:sticky;top:0;z-index:30;background:rgba(9,9,11,0.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.08);">
      <div class="cz-nr-container" style="height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <span data-cuzmify-field="business-name" class="brand-name cz-nr-display" style="font-size:1.1rem;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(profile.name)}</span>
        <a href="#booking" style="padding:9px 18px;border-radius:10px;background:var(--cz-noir-accent);color:#09090B;font-size:12px;font-weight:800;text-decoration:none;white-space:nowrap;">${escapeHtml(niche.vocabulary.primaryCta)}</a>
      </div>
    </nav>

    <section id="hero" data-cuzmify-type="hero" style="position:relative;min-height:460px;display:flex;align-items:flex-end;overflow:hidden;border-bottom:1px solid rgba(255,255,255,0.08);">
      ${
        heroAsset
          ? `<img src="${escapeHtml(getMediaDisplayUrl(heroAsset))}" alt="${escapeHtml(profile.name)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.48;"/>`
          : ''
      }
      <div style="position:absolute;inset:0;background:linear-gradient(to top,#09090B 12%,rgba(9,9,11,0.55) 60%,rgba(9,9,11,0.35) 100%);"></div>
      <div class="cz-nr-container" style="position:relative;z-index:2;padding-top:96px;padding-bottom:48px;width:100%;">
        <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(245,158,11,0.16);border:1px solid rgba(245,158,11,0.35);color:var(--cz-noir-accent);font-size:11px;font-weight:700;margin-bottom:16px;">
          ${escapeHtml(niche.shortLabel)}${locationLine ? ` • ${escapeHtml(locationLine)}` : ''}
        </span>
        <h1 data-cuzmify-field="headline" class="cz-nr-display" style="font-size:clamp(2.1rem,5.5vw,3.75rem);font-weight:800;line-height:1.06;margin:0 0 14px;max-width:740px;">
          ${escapeHtml(headline)}
        </h1>
        <p data-cuzmify-field="subheadline" style="font-size:15px;color:#D4D4D8;line-height:1.65;margin:0 0 26px;max-width:540px;">
          ${escapeHtml(subheadline)}
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <a href="#booking" style="padding:14px 26px;border-radius:12px;background:var(--cz-noir-accent);color:#09090B;font-weight:800;font-size:13px;text-decoration:none;">${escapeHtml(niche.vocabulary.primaryCta)} →</a>
          ${galleryAssets.length > 0 ? `<a href="#portfolio" style="padding:14px 22px;border-radius:12px;background:rgba(255,255,255,0.1);color:#FAFAFA;font-weight:700;font-size:13px;text-decoration:none;backdrop-filter:blur(8px);">View Work</a>` : ''}
        </div>
      </div>
    </section>

    ${galleryHtml}
    ${servicesHtml}

    <section id="booking" data-cuzmify-type="booking" style="padding:56px 0 88px;border-top:1px solid rgba(255,255,255,0.08);">
      <div class="cz-nr-container" style="max-width:640px;">
        <div style="background:var(--cz-noir-card);border:1px solid rgba(255,255,255,0.12);border-radius:24px;padding:32px 24px;">
          <div style="text-align:center;margin-bottom:24px;">
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.16em;color:var(--cz-noir-accent);font-weight:700;">${escapeHtml(niche.vocabulary.enquiryEyebrow)}</span>
            <h2 class="cz-nr-display" style="font-size:clamp(1.6rem,3.5vw,2.1rem);font-weight:700;margin:8px 0;">${escapeHtml(niche.vocabulary.enquiryHeading)}</h2>
            <p style="font-size:13px;color:var(--cz-noir-muted);margin:0;">${escapeHtml(niche.vocabulary.enquirySubheading)}</p>
          </div>
          ${renderSharedEnquiryForm(bp, niche, services, currencySymbol, siteId, true)}
        </div>
      </div>
    </section>
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
  const stripAssets = vault.slice(0, 3);
  const igHandle = (profile.instagramHandle || profile.instagram || '').replace(/^@/, '');
  const locationLine = [profile.city, profile.country].filter(Boolean).join(', ');
  const headline = bp.customCopy?.headline || profile.tagline || `${profile.name} — ${niche.shortLabel}`;
  const subheadline =
    bp.customCopy?.subheadline ||
    profile.bio ||
    (locationLine ? `Serving clients in ${locationLine}. View packages and book directly below.` : `View our packages, recent work, and check availability directly below.`);
  const waPhone = (bp.modules?.whatsapp?.phoneNumber || profile.whatsapp || '').replace(/[^\d]/g, '');

  const css = `
    :root { --cz-ms-bg:#F8FAFC; --cz-ms-card:#FFFFFF; --cz-ms-primary:#0D5771; --cz-ms-ink:#0F172A; --cz-ms-muted:#64748B; --cz-ms-border:#E2E8F0; }
    .cz-ms-root { background:var(--cz-ms-bg); color:var(--cz-ms-ink); font-family:'Inter',system-ui,sans-serif; margin:0; padding-bottom:72px; }
    .cz-ms-heading { font-family:'Outfit',system-ui,sans-serif; }
    .cz-ms-container { max-width:1080px; margin:0 auto; padding:0 18px; box-sizing:border-box; }
    .cz-ms-services { display:grid; grid-template-columns:1fr; gap:16px; }
    .cz-ms-gallery { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
    .cz-ms-sticky-cta { position:fixed; bottom:12px; left:16px; right:16px; z-index:40; display:flex; justify-content:center; pointer-events:none; }
    @media (min-width:768px) {
      .cz-ms-root { padding-bottom:0; }
      .cz-ms-container { padding:0 36px; }
      .cz-ms-services { grid-template-columns:repeat(3,1fr); gap:20px; }
      .cz-ms-gallery { grid-template-columns:repeat(4,1fr); gap:14px; }
      .cz-ms-sticky-cta { display:none; }
    }
  `;

  const stripHtml =
    stripAssets.length > 0
      ? `<div style="display:grid;grid-template-columns:repeat(${stripAssets.length},1fr);gap:10px;margin-top:28px;">
          ${stripAssets
            .map(
              (a) => `<div style="border-radius:16px;overflow:hidden;aspect-ratio:4/3;background:#E2E8F0;">
                <img src="${escapeHtml(getMediaDisplayUrl(a))}" alt="${escapeHtml(a.name)}" style="width:100%;height:100%;object-fit:cover;display:block;"/>
              </div>`
            )
            .join('')}
        </div>`
      : '';

  const servicesHtml =
    services.length > 0
      ? `<section id="services" data-cuzmify-type="services" style="padding:48px 0;">
          <div class="cz-ms-container">
            <div style="margin-bottom:24px;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--cz-ms-primary);">${escapeHtml(niche.vocabulary.servicesEyebrow)}</span>
              <h2 class="cz-ms-heading" style="font-size:clamp(1.5rem,3vw,2rem);font-weight:800;margin:6px 0 0;">${escapeHtml(niche.vocabulary.servicesHeading)}</h2>
            </div>
            <div class="cz-ms-services services-grid">
              ${services
                .map((srv) => {
                  const pText = formatServicePrice(srv, currencySymbol);
                  return `<div data-cuzmify-target-id="${escapeHtml(srv.id)}" style="background:#FFFFFF;border:1px solid var(--cz-ms-border);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 4px 16px rgba(15,23,42,0.04);">
                    <div>
                      ${srv.imageUrl ? `<div style="aspect-ratio:16/10;background:#F1F5F9;overflow:hidden;"><img src="${escapeHtml(srv.imageUrl)}" alt="${escapeHtml(srv.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"/></div>` : ''}
                      <div style="padding:20px 20px 12px;">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                          <h3 data-cuzmify-field="service-name" class="cz-ms-heading" style="font-size:1.05rem;font-weight:700;margin:0;color:var(--cz-ms-ink);">${escapeHtml(srv.name)}</h3>
                          <span data-cuzmify-field="service-price" style="font-size:0.95rem;font-weight:800;color:#059669;background:#ECFDF5;padding:4px 10px;border-radius:999px;white-space:nowrap;">${escapeHtml(pText)}</span>
                        </div>
                        ${srv.description ? `<p style="font-size:13px;color:var(--cz-ms-muted);line-height:1.6;margin:10px 0 0;">${escapeHtml(srv.description)}</p>` : ''}
                      </div>
                    </div>
                    <div style="padding:0 20px 20px;">
                      <a href="#booking" data-select-service="${escapeHtml(`${srv.name} (${pText})`)}" style="display:flex;align-items:center;justify-content:center;width:100%;padding:11px 14px;border-radius:12px;background:var(--cz-ms-primary);color:#FFFFFF;font-size:12px;font-weight:700;text-decoration:none;box-sizing:border-box;">${escapeHtml(niche.vocabulary.serviceItemCta)}</a>
                    </div>
                  </div>`;
                })
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const galleryHtml =
    vault.length > 0
      ? `<section id="portfolio" data-cuzmify-type="gallery" style="padding:48px 0;">
          <div class="cz-ms-container">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px;">
              <h2 class="cz-ms-heading" data-cuzmify-field="portfolio-headline" style="font-size:clamp(1.4rem,3vw,1.85rem);font-weight:800;margin:0;">${escapeHtml(niche.vocabulary.portfolioHeading)}</h2>
              ${igHandle ? `<a href="https://instagram.com/${escapeHtml(igHandle)}" target="_blank" rel="noopener noreferrer" style="font-size:12px;font-weight:700;color:var(--cz-ms-primary);text-decoration:none;">Follow @${escapeHtml(igHandle)} ↗</a>` : ''}
            </div>
            <div class="cz-ms-gallery gallery-grid">
              ${vault
                .slice(0, 12)
                .map(
                  (m) => `<div style="border-radius:14px;overflow:hidden;aspect-ratio:1/1;background:#E2E8F0;">
                    <img src="${escapeHtml(getMediaDisplayUrl(m))}" alt="${escapeHtml(m.name)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;"/>
                  </div>`
                )
                .join('')}
            </div>
          </div>
        </section>`
      : '';

  const html = `<div class="cz-ms-root" data-cuzmify-template="modern-studio">
    <nav data-cuzmify-type="navbar" style="background:#FFFFFF;border-bottom:1px solid var(--cz-ms-border);position:sticky;top:0;z-index:30;">
      <div class="cz-ms-container" style="height:60px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;">
          <span style="width:8px;height:8px;border-radius:999px;background:#10B981;flex-shrink:0;"></span>
          <span data-cuzmify-field="business-name" class="brand-name cz-ms-heading" style="font-size:1.05rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(profile.name)}</span>
        </div>
        <a href="#booking" style="padding:8px 16px;border-radius:10px;background:var(--cz-ms-primary);color:#FFFFFF;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap;">${escapeHtml(niche.vocabulary.primaryCta)}</a>
      </div>
    </nav>

    <section id="hero" data-cuzmify-type="hero" style="padding:36px 0 24px;">
      <div class="cz-ms-container">
        <div style="background:#FFFFFF;border:1px solid var(--cz-ms-border);border-radius:24px;padding:28px 22px;box-shadow:0 8px 30px rgba(13,87,113,0.05);">
          <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:rgba(13,87,113,0.08);color:var(--cz-ms-primary);font-size:11px;font-weight:700;margin-bottom:12px;">
            ${escapeHtml(niche.label)}${locationLine ? ` • ${escapeHtml(locationLine)}` : ''}
          </span>
          <h1 data-cuzmify-field="headline" class="cz-ms-heading" style="font-size:clamp(1.75rem,4.2vw,2.75rem);font-weight:800;line-height:1.15;margin:0 0 12px;">
            ${escapeHtml(headline)}
          </h1>
          <p data-cuzmify-field="subheadline" style="font-size:14px;color:var(--cz-ms-muted);line-height:1.65;margin:0 0 22px;max-width:600px;">
            ${escapeHtml(subheadline)}
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:10px;">
            <a href="#booking" style="padding:13px 22px;border-radius:12px;background:var(--cz-ms-primary);color:#FFFFFF;font-weight:700;font-size:13px;text-decoration:none;">${escapeHtml(niche.vocabulary.primaryCta)} →</a>
            ${waPhone ? `<a href="${escapeHtml(buildWhatsAppDirectHref(waPhone, `Hello ${profile.name}, I found your website and have a quick question.`))}" target="_blank" rel="noopener noreferrer" style="padding:13px 20px;border-radius:12px;background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;font-weight:700;font-size:13px;text-decoration:none;">Chat on WhatsApp</a>` : ''}
          </div>
          ${stripHtml}
        </div>
      </div>
    </section>

    ${servicesHtml}
    ${galleryHtml}

    <section id="booking" data-cuzmify-type="booking" style="padding:40px 0 64px;">
      <div class="cz-ms-container" style="max-width:620px;">
        <div style="background:#FFFFFF;border:1px solid var(--cz-ms-border);border-radius:24px;padding:28px 22px;box-shadow:0 12px 36px rgba(15,23,42,0.06);">
          <div style="text-align:center;margin-bottom:22px;">
            <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--cz-ms-primary);">${escapeHtml(niche.vocabulary.enquiryEyebrow)}</span>
            <h2 class="cz-ms-heading" style="font-size:clamp(1.45rem,3.5vw,1.95rem);font-weight:800;margin:6px 0;">${escapeHtml(niche.vocabulary.enquiryHeading)}</h2>
            <p style="font-size:13px;color:var(--cz-ms-muted);margin:0;">${escapeHtml(niche.vocabulary.enquirySubheading)}</p>
          </div>
          ${renderSharedEnquiryForm(bp, niche, services, currencySymbol, siteId, false)}
        </div>
      </div>
    </section>

    <div class="cz-ms-sticky-cta">
      <a href="#booking" style="pointer-events:auto;width:100%;max-width:420px;padding:14px 20px;border-radius:999px;background:var(--cz-ms-primary);color:#FFFFFF;font-weight:800;font-size:13px;text-align:center;text-decoration:none;box-shadow:0 12px 30px rgba(13,87,113,0.35);">
        ${escapeHtml(niche.vocabulary.primaryCta)} →
      </a>
    </div>
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

  return {
    templateId,
    nicheId: niche.id,
    css: rendered.css,
    html: rendered.html,
    fullHtml: `<style>${rendered.css}</style>\n${rendered.html}`,
    googleFontsUrl: meta.googleFontsUrl,
  };
}
