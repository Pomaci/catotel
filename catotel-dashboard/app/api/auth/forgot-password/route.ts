import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';
import { backendForgotPassword } from '@/lib/server/backend-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const body = (await request.json()) as { email?: string };

  try {
    await backendForgotPassword({
      email: body.email ?? '',
    });
    return NextResponse.json({
      message: 'If the email exists, a reset link will be sent.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
