import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ACCESS_COOKIE = 'catotel_access';
const PROTECTED_PATHS = ['/dashboard'];

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

  if (isProtected) {
    const meResponse = await fetch(new URL('/api/auth/me', request.url), {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
    });
    if (!meResponse.ok) {
      return redirectToLogin(request);
    }
  }

  if (pathname === '/') {
    const meResponse = await fetch(new URL('/api/auth/me', request.url), {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
    });
    if (meResponse.ok) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
