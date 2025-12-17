import { NextResponse } from 'next/server';
import { backendMe, backendRefresh } from '@/lib/server/backend-auth';
import {
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from '@/lib/server/auth-cookies';
import { handleApiError } from '@/lib/server/api-error-response';
import { ApiError } from '@catotel/api-client';
import { ensureCsrfToken } from '@/lib/server/csrf';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accessToken = getAccessTokenFromCookies();
  const activeToken = accessToken ?? (await refreshUsingCookie());

  if (!activeToken) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await backendMe(activeToken);
    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const refreshed = await refreshUsingCookie();
      if (refreshed) {
        try {
          const profile = await backendMe(refreshed);
          return NextResponse.json(profile);
        } catch (err) {
          return handleApiError(err);
        }
      }
    }
    return handleApiError(error);
  }
}

async function refreshUsingCookie() {
  const refreshToken = getRefreshTokenFromCookies();
  if (!refreshToken) {
    return null;
  }

  try {
    const tokens = await backendRefresh({ refresh_token: refreshToken });
    setAuthCookies(tokens);
    ensureCsrfToken();
    return tokens.access_token;
  } catch (err) {
    return null;
  }
}
