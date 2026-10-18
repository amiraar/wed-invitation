import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// 'unsafe-eval' is only needed by the dev server (React Refresh), never in production.
const isDev = process.env.NODE_ENV !== 'production';

const csp = [
  "default-src 'self'",
  "img-src 'self' https: data: blob:",
  "media-src 'self' https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "connect-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = '/admin/login';
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('wed_auth')?.value ?? null;
    const jwtSecret = process.env.JWT_SECRET;

    // Fail closed: without a configured secret no token can be trusted.
    if (!token || !jwtSecret) return redirectToLogin(request);

    try {
      await jwtVerify(token, new TextEncoder().encode(jwtSecret), { algorithms: ['HS256'] });
    } catch {
      return redirectToLogin(request);
    }
  }

  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // HSTS only in production, so a local dev domain is never pinned to HTTPS.
  if (!isDev) response.headers.set('Strict-Transport-Security', 'max-age=31536000');
  return response;
}

export const config = {
  // Every route except static build assets, so the public invitation page gets the CSP too.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
