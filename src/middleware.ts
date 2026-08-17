import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED = ['/editor', '/dashboard', '/profile'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some((path) => pathname.startsWith(path));

  if (isProtected && !req.auth) {
    // Redirect unauthenticated users to landing page
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('authRequired', '1');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon|.*\\..*).*)'],
};
