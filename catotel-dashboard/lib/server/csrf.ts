import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomBytes, timingSafeEqual } from 'crypto';

const CSRF_COOKIE = 'catotel_csrf';

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function ensureCsrfToken() {
  const store = cookies();
  const existing = store.get(CSRF_COOKIE)?.value;
  if (existing) {
    return existing;
  }
  const token = randomBytes(32).toString('hex');
  store.set({
    name: CSRF_COOKIE,
    value: token,
    httpOnly: false,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  });
  return token;
}

export function getCsrfTokenFromCookie() {
  return cookies().get(CSRF_COOKIE)?.value ?? null;
}

export function verifyCsrfToken(request: Request) {
  const sentToken =
    request.headers.get('x-csrf-token') ??
    headers().get('x-csrf-token') ??
    null;
  const cookieToken = getCsrfTokenFromCookie();
  if (!sentToken || !cookieToken) {
    return false;
  }
  try {
    return timingSafeEqual(
      Buffer.from(sentToken),
      Buffer.from(cookieToken),
    );
  } catch {
    return false;
  }
}

export function requireCsrfToken(request: Request) {
  if (verifyCsrfToken(request)) {
    return null;
  }

  // Try to auto-heal by issuing a new token once
  const token = ensureCsrfToken();
  const retrySentToken =
    request.headers.get('x-csrf-token') ??
    headers().get('x-csrf-token') ??
    null;

  if (retrySentToken && timingSafeEqual(Buffer.from(retrySentToken), Buffer.from(token))) {
    return null;
  }

  return NextResponse.json(
    { message: 'CSRF validation failed' },
    { status: 403 },
  );
}
