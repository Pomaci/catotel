import { cookies } from 'next/headers';
import { jwtDecode } from 'jwt-decode';
import type { AuthResponseDto, AuthTokensDto } from '@catotel/api-client';

const ACCESS_COOKIE = 'catotel_access';
const REFRESH_COOKIE = 'catotel_refresh';
const ACCESS_FALLBACK_SECONDS = 15 * 60;
const REFRESH_FALLBACK_SECONDS = 7 * 24 * 60 * 60;

type JwtPayload = {
  exp?: number;
};

function tokenMaxAge(token: string, fallback: number) {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded?.exp) {
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        return expiresIn;
      }
    }
  } catch {
    // ignore malformed tokens
  }
  return fallback;
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

export function setAuthCookies(tokens: AuthTokensDto | AuthResponseDto) {
  const cookieStore = cookies();
  cookieStore.set({
    name: ACCESS_COOKIE,
    value: tokens.access_token,
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: tokenMaxAge(tokens.access_token, ACCESS_FALLBACK_SECONDS),
  });
  cookieStore.set({
    name: REFRESH_COOKIE,
    value: tokens.refresh_token,
    httpOnly: true,
    secure: isProduction(),
    sameSite: 'lax',
    path: '/',
    maxAge: tokenMaxAge(tokens.refresh_token, REFRESH_FALLBACK_SECONDS),
  });
}

export function clearAuthCookies() {
  const cookieStore = cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export function getAccessTokenFromCookies() {
  return cookies().get(ACCESS_COOKIE)?.value ?? null;
}

export function getRefreshTokenFromCookies() {
  return cookies().get(REFRESH_COOKIE)?.value ?? null;
}
