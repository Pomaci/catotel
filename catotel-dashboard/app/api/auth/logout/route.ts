import { NextResponse } from 'next/server';
import { backendLogout } from '@/lib/server/backend-auth';
import {
  clearAuthCookies,
  getRefreshTokenFromCookies,
} from '@/lib/server/auth-cookies';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

export async function POST(request: Request) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const refreshToken = getRefreshTokenFromCookies();

  try {
    if (refreshToken) {
      await backendLogout({ refresh_token: refreshToken });
    }
    clearAuthCookies();
    return NextResponse.json({ ok: true });
  } catch (error) {
    clearAuthCookies();
    return handleApiError(error);
  }
}
