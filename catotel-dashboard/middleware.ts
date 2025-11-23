import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

const ACCESS_COOKIE = 'catotel_access';
const PROTECTED_PATHS = ['/dashboard'];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    console.error('ACCESS_TOKEN_SECRET is not configured');
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      {
        issuer: process.env.JWT_ISSUER ?? 'catotel-api',
        audience: process.env.JWT_AUDIENCE ?? 'catotel-client',
      },
    );
    return payload;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(ACCESS_COOKIE);
  return response;
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  const isProtected = isProtectedPath(pathname);
  const tokenPayload = accessToken
    ? await verifyAccessToken(accessToken)
    : null;

  if (isProtected && !tokenPayload) {
    return redirectToLogin(request);
  }

  if (pathname === '/' && tokenPayload) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
