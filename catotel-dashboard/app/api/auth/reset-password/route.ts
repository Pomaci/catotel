import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';
import { backendResetPassword } from '@/lib/server/backend-auth';

export async function POST(request: NextRequest) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const body = (await request.json()) as {
    token?: string;
    password?: string;
  };

  try {
    await backendResetPassword({
      token: body.token ?? '',
      password: body.password ?? '',
    });
    return NextResponse.json({ message: 'Password updated successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}

