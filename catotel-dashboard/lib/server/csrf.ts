import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';
import { getRefreshTokenFromCookies } from './auth-cookies';

const CSRF_COOKIE = 'catotel_csrf';
const CSRF_SECRET_COOKIE = 'catotel_csrf_secret';
const ONE_DAY = 60 * 60 * 24;
const SECRET_TTL = ONE_DAY * 30;

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function readSentCsrfToken(request: Request) {
  return (
    request.headers.get('x-csrf-token') ??
    headers().get('x-csrf-token') ??
    null
  );
}

function toBytes(value: string) {
  return new TextEncoder().encode(value);
}

function hashValue(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

function ensureCsrfSecret() {
  const store = cookies();
  const existing = store.get(CSRF_SECRET_COOKIE)?.value;
  if (existing) {
    return existing;
  }
  const secret = randomBytes(32).toString('hex');
  store.set({
    name: CSRF_SECRET_COOKIE,
    value: secret,
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: SECRET_TTL,
  });
  return secret;
}

function getCsrfSecret() {
  return cookies().get(CSRF_SECRET_COOKIE)?.value ?? null;
}

function deriveSessionBinding(secret: string) {
  const refreshToken = getRefreshTokenFromCookies();
  if (refreshToken) {
    return hashValue(refreshToken);
  }
  return hashValue(`anon:${secret}`);
}

function generateCsrfToken(secret: string) {
  const sessionKey = deriveSessionBinding(secret);
  return createHmac('sha256', secret).update(sessionKey).digest('hex');
}

function setCsrfCookie(token: string) {
  const store = cookies();
  store.set({
    name: CSRF_COOKIE,
    value: token,
    httpOnly: false,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_DAY,
  });
}

export function ensureCsrfToken() {
  const secret = ensureCsrfSecret();
  const token = generateCsrfToken(secret);
  setCsrfCookie(token);
  return token;
}

export function getCsrfTokenFromCookie() {
  return cookies().get(CSRF_COOKIE)?.value ?? null;
}

export function verifyCsrfToken(request: Request) {
  const sentToken = readSentCsrfToken(request);
  const cookieToken = getCsrfTokenFromCookie();
  const secret = getCsrfSecret();

  if (!sentToken || !cookieToken || !secret) {
    return false;
  }

  const expectedToken = generateCsrfToken(secret);

  try {
    return (
      timingSafeEqual(toBytes(sentToken), toBytes(expectedToken)) &&
      timingSafeEqual(toBytes(cookieToken), toBytes(expectedToken))
    );
  } catch {
    return false;
  }
}

export function requireCsrfToken(request: Request) {
  if (verifyCsrfToken(request)) {
    return null;
  }

  ensureCsrfToken();

  return NextResponse.json(
    { message: 'CSRF validation failed' },
    { status: 403 },
  );
}
