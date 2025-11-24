import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const ACCESS_COOKIE = 'catotel_access';
const PROTECTED_PATHS = ['/dashboard'];

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    return jwtDecode<{ exp?: number }>(token);
  } catch {
    return null;
  }
}

function hasValidAccessToken(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return false;
  }
  const payload = decodeJwtPayload(token);
  if (payload?.exp && payload.exp * 1000 <= Date.now()) {
    return false;
  }
  return true;
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

  const authenticated = hasValidAccessToken(request);

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
