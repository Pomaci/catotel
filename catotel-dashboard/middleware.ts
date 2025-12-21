import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const ACCESS_COOKIE = 'catotel_access';
const CSRF_COOKIE = 'catotel_csrf';
const PROTECTED_PATHS = ['/dashboard'];

type JwtPayload = {
  exp?: number;
};

function extractSetCookies(res: Response): string[] {
  const header = res.headers.get('set-cookie');
  if (!header) {
    return [];
  }
  // Split on comma delimiters that precede another cookie assignment.
  return header.split(/,(?=[^;]+=[^;]+)/).map((c) => c.trim()).filter(Boolean);
}

function appendCookies(response: NextResponse, cookies: string[]) {
  for (const cookie of cookies) {
    response.headers.append('set-cookie', cookie);
  }
  return response;
}

function isAccessTokenFresh(token: string) {
  // Only read the exp claim here; signature verification is handled by the API proxy.
  try {
    const { exp } = jwtDecode<JwtPayload>(token);
    if (!exp) return false;
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

async function syncSessionFromApi(request: NextRequest) {
  try {
    const res = await fetch(new URL('/api/auth/me', request.url), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { authenticated: false, cookies: [] };
    }
    return { authenticated: true, cookies: extractSetCookies(res) };
  } catch {
    return { authenticated: false, cookies: [] };
  }
}

async function bootstrapCsrfCookie(request: NextRequest) {
  try {
    const csrfRes = await fetch(new URL('/api/auth/csrf', request.url), {
      headers: { cookie: request.headers.get('cookie') ?? '' },
      cache: 'no-store',
    });
    if (!csrfRes.ok) {
      return [];
    }
    return extractSetCookies(csrfRes);
  } catch {
    return [];
  }
}

async function hasValidAccessToken(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return false;
  }
  return isAccessTokenFresh(token);
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
  const hasCsrfCookie = Boolean(request.cookies.get(CSRF_COOKIE));

  const pendingCookies: string[] = [];
  const authenticated = await hasValidAccessToken(request);
  const fallback = authenticated ? null : await syncSessionFromApi(request);
  const authOk = authenticated || Boolean(fallback?.authenticated);

  if (fallback?.cookies?.length) {
    pendingCookies.push(...fallback.cookies);
  }

  if (authOk && !hasCsrfCookie && request.method === 'GET') {
    const csrfCookies = await bootstrapCsrfCookie(request);
    if (csrfCookies.length) {
      pendingCookies.push(...csrfCookies);
    }
  }

  if (isProtected) {
    if (!authOk) {
      return redirectToLogin(request);
    }
    return appendCookies(NextResponse.next(), pendingCookies);
  }

  if (pathname === '/') {
    if (authOk) {
      return appendCookies(
        NextResponse.redirect(new URL('/dashboard', request.url)),
        pendingCookies,
      );
    }
    return appendCookies(NextResponse.next(), pendingCookies);
  }

  return appendCookies(NextResponse.next(), pendingCookies);
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
