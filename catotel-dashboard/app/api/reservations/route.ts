import { NextResponse } from 'next/server';
import { backendRequest } from '@/lib/server/backend-client';
import { getAccessTokenFromCookies } from '@/lib/server/auth-cookies';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

export async function GET(request: Request) {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;

  try {
    const reservations = await backendRequest(
      {
        method: 'GET',
        url: '/reservations',
        query: status ? { status } : undefined,
      },
      token,
    );
    return NextResponse.json(reservations);
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
    const reservation = await backendRequest(
      {
        method: 'POST',
        url: '/reservations',
        body,
        mediaType: 'application/json',
      },
      token,
    );
    return NextResponse.json(reservation);
  } catch (error) {
    return handleApiError(error);
  }
}
