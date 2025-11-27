import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_COOKIE = 'catotel_access';
const PROTECTED_PATHS = ['/dashboard'];
const encoder = new TextEncoder();

async function verifyJwt(token: string) {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret), {
      issuer: process.env.JWT_ISSUER ?? 'catotel-api',
      audience: process.env.JWT_AUDIENCE ?? 'catotel-client',
    });
    if (payload?.exp && payload.exp * 1000 <= Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function hasValidAccessToken(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return false;
  }
  if (await verifyJwt(token)) {
    return true;
  }
  try {
    const res = await fetch(new URL('/api/auth/me', request.url), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete('catotel_refresh');
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = isProtectedPath(pathname);

  const authenticated = await hasValidAccessToken(request);

  if (isProtected) {
    if (!authenticated) {
      return redirectToLogin(request);
    }
  }

  if (pathname === '/') {
    if (authenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
