import { NextResponse } from 'next/server';
import { backendRefresh } from '@/lib/server/backend-auth';
import {
  getRefreshTokenFromCookies,
  setAuthCookies,
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
  if (!refreshToken) {
    return NextResponse.json({ message: 'Refresh token yok.' }, { status: 401 });
  }

  try {
    const tokens = await backendRefresh({ refresh_token: refreshToken });
    setAuthCookies(tokens);
    ensureCsrfToken();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
