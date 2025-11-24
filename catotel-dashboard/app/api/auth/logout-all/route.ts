import { NextResponse } from 'next/server';
import { backendLogoutAll } from '@/lib/server/backend-auth';
import {
  clearAuthCookies,
  getAccessTokenFromCookies,
} from '@/lib/server/auth-cookies';
import { handleApiError } from '@/lib/server/api-error-response';
import { ensureCsrfToken, requireCsrfToken } from '@/lib/server/csrf';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const accessToken = getAccessTokenFromCookies();

  try {
    if (accessToken) {
      await backendLogoutAll(accessToken);
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
