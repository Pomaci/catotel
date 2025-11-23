import { NextResponse } from 'next/server';
import { backendRequest } from '@/lib/server/backend-client';
import { getAccessTokenFromCookies } from '@/lib/server/auth-cookies';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

export async function GET() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cats = await backendRequest(
      {
        method: 'GET',
        url: '/customers/cats',
      },
      token,
    );
    return NextResponse.json(cats);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const token = getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  try {
    const cat = await backendRequest(
      {
        method: 'POST',
        url: '/customers/cats',
        body,
        mediaType: 'application/json',
      },
      token,
    );
    return NextResponse.json(cat);
  } catch (error) {
    return handleApiError(error);
  }
}
