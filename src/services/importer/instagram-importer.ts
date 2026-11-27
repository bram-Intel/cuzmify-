import { CurrencyCode, MediaVaultAsset, ServiceItem } from '@/core/blueprint-schema';
import { resolveAssetMediaKind } from '@/core/media-utils';

export interface InstagramImportResult {
  handle: string;
  businessName: string;
  tagline: string;
  category: string;
  whatsapp: string;
  mediaVault: MediaVaultAsset[];
  services: ServiceItem[];
  suggestedTemplate: string;
}

export class InstagramImporter {
  private static mediaCache = new Map<string, MediaVaultAsset[]>();

  static setCachedMedia(handle: string, assets: MediaVaultAsset[]) {
    if (assets && assets.length > 0) {
      this.mediaCache.set(this.cleanHandle(handle), assets);
    }
  }

  static getCachedMedia(handle: string): MediaVaultAsset[] | null {
    return this.mediaCache.get(this.cleanHandle(handle)) || null;
  }

  /**
   * Builds a permanent self-healing proxy URL so published websites never break
   * when Meta's signed `scontent-*.cdninstagram.com` URLs expire after a few days.
   */
  static buildPermanentProxyUrl(mediaId: string, handle: string, siteId?: string, kind: 'image' | 'video' = 'image'): string {
    const params = new URLSearchParams({
      mediaId,
      handle: this.cleanHandle(handle),
      ...(siteId && siteId !== 'proj_default' ? { siteId } : {}),
      ...(kind === 'video' ? { kind: 'video' } : {}),
    });
    return `/api/media/ig?${params.toString()}`;
  }

  /**
   * Re-binds proxy URLs to a concrete `siteId` once the database site record is resolved.
   */
  static bindSiteIdToVault(assets: MediaVaultAsset[], siteId: string, handle: string): MediaVaultAsset[] {
    if (!siteId || siteId === 'proj_default') return assets;
    return assets.map((asset) => {
      if (!asset.igMediaId) return asset;
      const isVideo = resolveAssetMediaKind(asset) === 'video';
      return {
        ...asset,
        mediaKind: isVideo ? 'video' : 'image',
        url: this.buildPermanentProxyUrl(asset.igMediaId, handle, siteId, isVideo ? 'video' : 'image'),
        thumbnailUrl: this.buildPermanentProxyUrl(asset.igMediaId, handle, siteId, 'image'),
      };
    });
  }

  /**
   * Transforms raw Instagram Graph API media objects into Cuzmify MediaVaultAssets,
   * unrolling CAROUSEL_ALBUMs, supporting VIDEO / REEL thumbnails, and attaching
   * non-expiring proxy URLs backed by the site's long-lived token.
   */
  static parseInstagramGraphMedia(dataItems: any[], handle: string, siteId?: string): MediaVaultAsset[] {
    const assets: MediaVaultAsset[] = [];
    const cleanHandle = this.cleanHandle(handle);

    for (const m of dataItems || []) {
      const isCarousel = m.media_type === 'CAROUSEL_ALBUM';
      const isTopLevelVideo = m.media_type === 'VIDEO';

      if (isCarousel && Array.isArray(m.children?.data) && m.children.data.length > 0) {
        m.children.data.forEach((child: any, cIdx: number) => {
          const childIsVideo = child.media_type === 'VIDEO';
          const rawUrl = child.media_url || child.thumbnail_url;
          const rawThumb = child.thumbnail_url || child.media_url;
          const childId = String(child.id || `${m.id}-${cIdx}`);

          if (rawUrl) {
            assets.push({
              id: `ig-live-${m.id}-${childId}`,
              igMediaId: childId,
              url: child.id ? this.buildPermanentProxyUrl(childId, cleanHandle, siteId, childIsVideo ? 'video' : 'image') : rawUrl,
              thumbnailUrl: child.id ? this.buildPermanentProxyUrl(childId, cleanHandle, siteId, 'image') : rawThumb,
              rawMediaUrl: rawUrl,
              rawThumbUrl: rawThumb,
              name: m.caption
                ? `${m.caption.slice(0, 30)} (Slide ${cIdx + 1}/${m.children.data.length})`
                : `Slide ${cIdx + 1}`,
              type: childIsVideo ? 'video' : 'gallery',
              mediaKind: childIsVideo ? 'video' : 'image',
              source: 'instagram',
              caption: m.caption || '',
              instagramPostUrl: m.permalink || `https://instagram.com/${cleanHandle}`,
              addedAt: m.timestamp || new Date().toISOString(),
            });
          }
        });
      } else {
        const rawUrl = m.media_url || m.thumbnail_url;
        const rawThumb = m.thumbnail_url || m.media_url;
        const mediaId = m.id ? String(m.id) : '';

        if (rawUrl) {
          assets.push({
            id: `ig-live-${mediaId || Date.now()}-${assets.length}`,
            igMediaId: mediaId || undefined,
            url: mediaId ? this.buildPermanentProxyUrl(mediaId, cleanHandle, siteId, isTopLevelVideo ? 'video' : 'image') : rawUrl,
            thumbnailUrl: mediaId ? this.buildPermanentProxyUrl(mediaId, cleanHandle, siteId, 'image') : rawThumb,
            rawMediaUrl: rawUrl,
            rawThumbUrl: rawThumb,
            name: m.caption
              ? m.caption.slice(0, 40)
              : (isTopLevelVideo ? `Reel #${assets.length + 1}` : `Post #${assets.length + 1}`),
            type: isTopLevelVideo ? 'video' : (assets.length === 0 ? 'hero' : 'gallery'),
            mediaKind: isTopLevelVideo ? 'video' : 'image',
            source: 'instagram',
            caption: m.caption || '',
            instagramPostUrl: m.permalink || `https://instagram.com/${cleanHandle}`,
            addedAt: m.timestamp || new Date().toISOString(),
          });
        }
      }
    }

    return assets;
  }

  /**
   * Cleans an Instagram username, handle, or URL into a raw handle.
   */
  static cleanHandle(input: string): string {
    let clean = input.trim().toLowerCase();
    clean = clean.replace(/^@+/, '');
    clean = clean.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//, '');
    clean = clean.replace(/[/?#].*$/, '');
    return clean.replace(/[^a-z0-9._]/g, '');
  }

  /**
   * Generates a human-friendly business name from an Instagram handle.
   */
  static formatBusinessName(handle: string): string {
    if (!handle) return 'My Studio';
    const parts = handle.split(/[._]+/).filter(Boolean);
    if (parts.length === 0) return 'My Studio';
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Truthful profile ingestion: returns ONLY real OAuth-imported media if cached,
   * never fake Unsplash photos or invented services/prices.
   */
  static async ingestProfile(handleOrUrl: string, _selectedCurrency: CurrencyCode = 'NGN'): Promise<InstagramImportResult> {
    const handle = this.cleanHandle(handleOrUrl);
    const businessName = this.formatBusinessName(handle);
    const cachedRealMedia = this.getCachedMedia(handle) || [];

    return {
      handle,
      businessName,
      tagline: '',
      category: 'Service Business',
      whatsapp: '',
      mediaVault: cachedRealMedia,
      services: [],
      suggestedTemplate: 'editorial-atelier',
    };
  }
}
