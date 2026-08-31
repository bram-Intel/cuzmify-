import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api/auth/ (NextAuth endpoints)
     * 2. /_next/ (Next.js internals)
     * 3. /_static or static files (favicon.ico, images, fonts)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;

  // Normalize hostname (strip port like :3000 if present)
  const currentHost = hostname.split(':')[0].toLowerCase();

  // Root platform hosts that serve the main Cuzmify app (landing, studio, dashboard, onboarding)
  const rootDomains = [
    'cuzmify.com',
    'www.cuzmify.com',
    'cuzmify.vercel.app',
    'localhost',
    '127.0.0.1',
  ];

  // If accessing from the root platform host directly, pass through normally
  if (rootDomains.includes(currentHost)) {
    return NextResponse.next();
  }

  // 1. Localhost Subdomain: e.g. "brammusic.localhost" (from http://brammusic.localhost:3000)
  if (currentHost.endsWith('.localhost')) {
    const subdomain = currentHost.replace('.localhost', '');
    if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'admin') {
      url.pathname = `/s/${subdomain}${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 2. Vercel Staging Subdomain: e.g. "brammusic.cuzmify.vercel.app"
  if (currentHost.endsWith('.cuzmify.vercel.app')) {
    const subdomain = currentHost.replace('.cuzmify.vercel.app', '');
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      url.pathname = `/s/${subdomain}${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 3. Production Wildcard Subdomain: e.g. "brammusic.cuzmify.com"
  if (currentHost.endsWith('.cuzmify.com')) {
    const subdomain = currentHost.replace('.cuzmify.com', '');
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      url.pathname = `/s/${subdomain}${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 4. Custom Apex / CNAME Domain: e.g. "brammusic.com" or "www.brammusic.com"
  const customDomain = currentHost.replace(/^www\./, '');
  url.pathname = `/s/${customDomain}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}
