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
      return { authenticated: false, response: null };
    }
    const next = NextResponse.next();
    for (const cookie of extractSetCookies(res)) {
      next.headers.append('set-cookie', cookie);
    }
    return { authenticated: true, response: next };
  } catch {
    return { authenticated: false, response: null };
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
  const isAuthPath = pathname.startsWith('/auth');
  const hasCsrfCookie = Boolean(request.cookies.get(CSRF_COOKIE));

  let bootstrapResponse: NextResponse | null = null;
  if (isAuthPath && !hasCsrfCookie && request.method === 'GET') {
    try {
      const csrfRes = await fetch(new URL('/api/auth/csrf', request.url), {
        headers: { cookie: request.headers.get('cookie') ?? '' },
        cache: 'no-store',
      });
      if (csrfRes.ok) {
        bootstrapResponse = NextResponse.next();
        for (const cookie of extractSetCookies(csrfRes)) {
          bootstrapResponse.headers.append('set-cookie', cookie);
        }
      }
    } catch {
      // ignore and fall through
    }
  }

  const authenticated = await hasValidAccessToken(request);
  const fallback = authenticated ? null : await syncSessionFromApi(request);
  const authOk = authenticated || fallback?.authenticated;
  const responseWithCookies = fallback?.response ?? null;

  if (isProtected) {
    if (!authOk) {
      return redirectToLogin(request);
    }
    if (responseWithCookies) {
      return responseWithCookies;
    }
    if (bootstrapResponse) {
      return bootstrapResponse;
    }
  }

  if (pathname === '/') {
    if (authOk) {
      const redirect = NextResponse.redirect(
        new URL('/dashboard', request.url),
      );
      const cookieSource = responseWithCookies ?? bootstrapResponse;
      if (cookieSource) {
        for (const cookie of extractSetCookies(cookieSource)) {
          redirect.headers.append('set-cookie', cookie);
        }
      }
      return redirect;
    }
  }

  return bootstrapResponse ?? NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
