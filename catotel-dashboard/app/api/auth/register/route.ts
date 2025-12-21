import { NextRequest, NextResponse } from 'next/server';
import { backendLogin, backendRegister } from '@/lib/server/backend-auth';
import { handleApiError } from '@/lib/server/api-error-response';
import { setAuthCookies } from '@/lib/server/auth-cookies';
import { ensureCsrfToken, requireCsrfToken } from '@/lib/server/csrf';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: 'Email ve şifre zorunludur.' },
      { status: 400 },
    );
  }

  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  try {
    await backendRegister({
      email: body.email,
      password: body.password,
      name: body.name,
    });
    const loginResponse = await backendLogin({
      email: body.email,
      password: body.password,
    });
    setAuthCookies(loginResponse);
    ensureCsrfToken();
    return NextResponse.json({ user: loginResponse.user });
  } catch (error) {
    return handleApiError(error);
  }
}
