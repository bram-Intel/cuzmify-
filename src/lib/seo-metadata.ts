import type { Metadata } from 'next';
import type { BusinessBlueprint } from '@/core/blueprint-schema';

export interface PublicSiteRecord {
  id: string;
  name: string;
  subdomain?: string | null;
  customDomain?: string | null;
  category?: string | null;
  whatsappPhone?: string | null;
  blueprintData?: string | null;
}

export function parseSiteBlueprint(raw?: string | null): BusinessBlueprint | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BusinessBlueprint;
  } catch {
    return null;
  }
}

export function buildPublicSiteMetadata(site: PublicSiteRecord | null, fallbackSlug?: string): Metadata {
  if (!site) {
    const label = fallbackSlug || 'Cuzmify';
    return {
      title: `${label} — Powered by Cuzmify`,
      description: `Explore ${label} on Cuzmify. Fast, responsive, and composable online business experience.`,
    };
  }

  const bp = parseSiteBlueprint(site.blueprintData);
  const seo = bp?.seo || {};
  const profile = bp?.profile;

  const title =
    seo.metaTitle?.trim() ||
    `${site.name}${profile?.city ? ` in ${profile.city}` : ''} — Official Portfolio & Bookings`;

  const description =
    seo.metaDescription?.trim() ||
    profile?.tagline?.trim() ||
    profile?.bio?.trim() ||
    `Explore ${site.name} (${site.category || 'Services'}) — portfolio, packages & direct WhatsApp enquiries.`;

  let ogImage: string | undefined =
    seo.ogImageUrl && seo.ogImageUrl.startsWith('http') ? seo.ogImageUrl : undefined;
  if (!ogImage && bp?.mediaVault?.length) {
    const rawImg = bp.mediaVault[0]?.thumbnailUrl || bp.mediaVault[0]?.url;
    if (rawImg && rawImg.startsWith('http')) ogImage = rawImg;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim();
  const canonical =
    seo.canonicalUrl?.trim() ||
    (site.customDomain
      ? `https://${site.customDomain}`
      : site.subdomain
        ? rootDomain
          ? `https://${site.subdomain}.${rootDomain}`
          : `https://cuzmify.com/s/${site.subdomain}`
        : undefined);

  return {
    title,
    description,
    ...(Array.isArray(seo.keywords) && seo.keywords.length > 0 ? { keywords: seo.keywords } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    ...(seo.noIndex ? { robots: { index: false, follow: false } } : { robots: { index: true, follow: true } }),
    openGraph: {
      title,
      description,
      siteName: site.name,
      type: 'website',
      ...(canonical ? { url: canonical } : {}),
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export function buildPublicSiteJsonLd(
  site: PublicSiteRecord,
  baseOrigin = process.env.NEXT_PUBLIC_ROOT_DOMAIN ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}` : 'https://cuzmify.com'
) {
  const bp = parseSiteBlueprint(site.blueprintData);
  const seo = bp?.seo || {};
  const profile = bp?.profile;
  const services = (bp?.modules?.services?.items || []).filter((s) => s.enabled !== false);
  const currency = profile?.currency || 'NGN';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim();
  const url =
    seo.canonicalUrl?.trim() ||
    (site.customDomain
      ? `https://${site.customDomain}`
      : site.subdomain
        ? rootDomain
          ? `https://${site.subdomain}.${rootDomain}`
          : `${baseOrigin}/s/${site.subdomain}`
        : `${baseOrigin}/site/${site.id}`);

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': seo.schemaType || 'LocalBusiness',
    name: profile?.name || site.name,
    url,
    ...(seo.metaDescription || profile?.bio || profile?.tagline
      ? { description: seo.metaDescription || profile?.bio || profile?.tagline }
      : {}),
    ...(seo.priceRange ? { priceRange: seo.priceRange } : {}),
    ...(seo.openingHours ? { openingHours: seo.openingHours } : {}),
    ...(seo.areaServed ? { areaServed: seo.areaServed } : {}),
    ...(profile?.city || profile?.country
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(profile.city ? { addressLocality: profile.city } : {}),
            ...(profile.country ? { addressCountry: profile.country } : {}),
          },
        }
      : {}),
    ...(site.whatsappPhone || bp?.modules?.whatsapp?.phoneNumber
      ? { telephone: `+${(site.whatsappPhone || bp?.modules?.whatsapp?.phoneNumber || '').replace(/[^\d]/g, '')}` }
      : {}),
    ...(services.length > 0
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Services & Packages',
            itemListElement: services.slice(0, 12).map((s) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: s.name,
                ...(s.description ? { description: s.description } : {}),
              },
              ...(s.price > 0 ? { price: s.price, priceCurrency: currency } : {}),
            })),
          },
        }
      : {}),
  };

  return jsonLd;
}
