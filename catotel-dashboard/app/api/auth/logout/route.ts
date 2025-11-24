import { NextResponse } from 'next/server';
import { backendLogout } from '@/lib/server/backend-auth';
import {
  clearAuthCookies,
  getRefreshTokenFromCookies,
} from '@/lib/server/auth-cookies';
import { handleApiError } from '@/lib/server/api-error-response';
import { ensureCsrfToken, requireCsrfToken } from '@/lib/server/csrf';

export const dynamic = 'force-dynamic';

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
    ensureCsrfToken();
    return NextResponse.json({ ok: true });
  } catch (error) {
    clearAuthCookies();
    ensureCsrfToken();
    return handleApiError(error);
  }
}
