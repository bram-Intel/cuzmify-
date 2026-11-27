import type { MediaVaultAsset } from './blueprint-schema';

export type MediaKind = 'image' | 'video';

const VIDEO_EXT_REGEX = /\.(?:mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i;

function escapeAttr(raw?: string | number | null): string {
  if (raw === null || raw === undefined) return '';
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Detects whether a URL or data URI points to an HTML5 playable video.
 */
export function isVideoMediaUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (/^data:video\//i.test(trimmed)) return true;
  if (/[?&]kind=video(?:&|$)/i.test(trimmed)) return true;
  if (/[?&]mime_type=video/i.test(trimmed)) return true;
  if (/#video\b/i.test(trimmed)) return true;
  return VIDEO_EXT_REGEX.test(trimmed);
}

/**
 * Resolves the canonical media kind (`'video'` or `'image'`) for a MediaVaultAsset.
 */
export function resolveAssetMediaKind(asset?: Partial<MediaVaultAsset> | null): MediaKind {
  if (!asset) return 'image';
  if (asset.mediaKind === 'video' || asset.type === 'video') return 'video';
  if (asset.mimeType && asset.mimeType.toLowerCase().startsWith('video/')) return 'video';
  if (isVideoMediaUrl(asset.url) || isVideoMediaUrl(asset.rawMediaUrl)) return 'video';
  return 'image';
}

/**
 * Returns the primary playable/display URL for an asset:
 * - Videos use `asset.url` (playable stream/file), falling back to `rawMediaUrl` / `thumbnailUrl`
 * - Images prefer optimized `thumbnailUrl` falling back to `url`
 */
export function getAssetRenderSource(asset?: Partial<MediaVaultAsset> | null): string {
  if (!asset) return '';
  if (resolveAssetMediaKind(asset) === 'video') {
    return asset.url || asset.rawMediaUrl || asset.thumbnailUrl || '';
  }
  return asset.thumbnailUrl || asset.url || '';
}

/**
 * Returns a non-video image poster URL for a video asset when available (e.g. IG Reel cover frame).
 */
export function getAssetPosterUrl(asset?: Partial<MediaVaultAsset> | null): string | undefined {
  if (!asset) return undefined;
  const candidate = asset.thumbnailUrl || asset.rawThumbUrl;
  if (!candidate || isVideoMediaUrl(candidate)) return undefined;
  return candidate;
}

export interface SmartMediaRenderOptions {
  src: string;
  mediaKind?: MediaKind;
  poster?: string;
  alt?: string;
  role?: 'hero' | 'gallery' | 'service' | 'product';
  assetId?: string;
  targetId?: string;
  style?: string;
  className?: string;
  heroBackground?: boolean;
  controls?: boolean;
  lazy?: boolean;
}

/**
 * Smart template renderer that outputs `<video>` for videos and `<img>` for images
 * with matching `data-cuzmify-*` semantic attributes so Desktop GrapesJS, Mobile Studio,
 * Public Live Sites, and MCP Inspection stay 100% unified.
 */
export function renderSmartMediaHtml(opts: SmartMediaRenderOptions): string {
  const src = (opts.src || '').trim();
  if (!src) return '';

  const kind: MediaKind = opts.mediaKind || (isVideoMediaUrl(src) ? 'video' : 'image');
  const commonAttrs = [
    opts.role ? `data-cuzmify-img-role="${escapeAttr(opts.role)}"` : '',
    `data-cuzmify-media-kind="${kind}"`,
    opts.assetId ? `data-cuzmify-asset-id="${escapeAttr(opts.assetId)}"` : '',
    opts.targetId ? `data-cuzmify-target-id="${escapeAttr(opts.targetId)}"` : '',
    opts.className ? `class="${escapeAttr(opts.className)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (kind === 'video') {
    const posterAttr =
      opts.poster && !isVideoMediaUrl(opts.poster)
        ? ` poster="${escapeAttr(opts.poster)}"`
        : '';
    const showControls = opts.controls === true && !opts.heroBackground;
    const playbackAttrs = `autoplay muted loop playsinline preload="auto"${showControls ? ' controls' : ''}`;
    const ariaAttr = opts.alt ? ` aria-label="${escapeAttr(opts.alt)}"` : '';
    const styleAttr = opts.style ? ` style="${escapeAttr(opts.style)}"` : '';
    return `<video ${commonAttrs} src="${escapeAttr(src)}"${posterAttr} ${playbackAttrs}${ariaAttr}${styleAttr}></video>`;
  }

  const altAttr = ` alt="${escapeAttr(opts.alt || '')}"`;
  const loadingAttrs = opts.lazy ? ' loading="lazy" decoding="async"' : ' decoding="async"';
  const styleAttr = opts.style ? ` style="${escapeAttr(opts.style)}"` : '';
  return `<img ${commonAttrs} src="${escapeAttr(src)}"${altAttr}${loadingAttrs}${styleAttr}/>`;
}
