import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

const csp = [
  "default-src 'self'",
  "img-src 'self' https: data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https:",
  "frame-ancestors 'self'"
].join('; ');

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('wed_auth')?.value ?? null;
  const payload = token ? verifyToken(token) : null;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!payload) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', csp);

  if (pathname.startsWith('/api') && payload) {
    response.headers.set('X-User-Id', payload.userId);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*']
};
