import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, _next internals, and the auth routes themselves
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/auth-login' ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.json')
  ) {
    return NextResponse.next();
  }

  // Check for the auth session cookie
  const sessionCookie = request.cookies.get('pos-session');

  if (!sessionCookie?.value) {
    // No session → redirect to login
    const loginUrl = new URL('/auth-login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Validate the cookie value
  const secret = process.env.AUTH_SECRET || 'fallback-secret';
  const expectedToken = Buffer.from(`authenticated:${secret}`).toString('base64');

  if (sessionCookie.value !== expectedToken) {
    // Invalid session → clear cookie and redirect to login
    const loginUrl = new URL('/auth-login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('pos-session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
