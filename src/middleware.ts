import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED = ['/dashboard', '/bulk-issue', '/analytics', '/events/new', '/events/'];
const AUTH_PAGES = ['/login', '/register'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /events/[id]/manage needs auth, but /events/[id] (claim page) does not
  const isManagePath = /^\/events\/[^/]+\/manage/.test(pathname);
  const isProtected = isManagePath || PROTECTED.some((path) => pathname === path || pathname.startsWith(path + '/'));
  const isClaimPage = /^\/events\/[^/]+$/.test(pathname); // Public claim page
  const isAuthPage = AUTH_PAGES.includes(pathname);

  const token = req.cookies.get('zc_session')?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'supersecretjwtsecretkeysupersecretjwtsecretkey');
      await jwtVerify(token, secret);
      isAuthenticated = true;
    } catch {
      // Token invalid/expired
    }
  }

  // Redirect unauthenticated users away from protected pages
  if (isProtected && !isClaimPage && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/bulk-issue', '/analytics', '/events/new', '/events/:path*/manage', '/login', '/register'],
};
