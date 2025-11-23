import { NextResponse } from 'next/server';
import { backendLogoutAll } from '@/lib/server/backend-auth';
import {
  clearAuthCookies,
  getAccessTokenFromCookies,
} from '@/lib/server/auth-cookies';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

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
    return NextResponse.json({ ok: true });
  } catch (error) {
    clearAuthCookies();
    return handleApiError(error);
  }
}
