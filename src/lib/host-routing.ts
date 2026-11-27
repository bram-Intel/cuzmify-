/**
 * Single source of truth for distinguishing the Cuzmify platform host
 * (landing, studio, dashboard) from creator live sites (`*.cuzmify.com`, custom domains).
 */
export function normalizeHostname(rawHost?: string | null): string {
  if (!rawHost) return '';
  return rawHost.split(',')[0].trim().split(':')[0].toLowerCase();
}

export function isPlatformHost(rawHost?: string | null): boolean {
  const host = normalizeHostname(rawHost);
  if (!host) return true;

  if (
    host === 'cuzmify.com' ||
    host === 'www.cuzmify.com' ||
    host === 'app.cuzmify.com' ||
    host === 'cuzmify.vercel.app' ||
    host === 'localhost' ||
    host === '127.0.0.1'
  ) {
    return true;
  }

  // Vercel preview deployments for the platform itself (but NOT *.cuzmify.vercel.app creator subdomains)
  if (host.endsWith('.vercel.app') && !host.endsWith('.cuzmify.vercel.app')) {
    return true;
  }

  return false;
}
