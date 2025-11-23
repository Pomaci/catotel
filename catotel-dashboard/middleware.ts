import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const ACCESS_COOKIE = 'catotel_access';
const PROTECTED_PATHS = ['/dashboard'];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname) && !accessToken) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/' && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
