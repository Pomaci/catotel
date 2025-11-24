import { NextResponse } from 'next/server';
import { backendRequestWithRefresh } from '@/lib/server/backend-auth-refresh';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;

  try {
    const reservations = await backendRequestWithRefresh(
      {
        method: 'GET',
        url: '/reservations',
        query: status ? { status } : undefined,
      },
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

  const body = await request.json();

  try {
    const reservation = await backendRequestWithRefresh(
      {
        method: 'POST',
        url: '/reservations',
        body,
        mediaType: 'application/json',
      },
    );
    return NextResponse.json(reservation);
  } catch (error) {
    return handleApiError(error);
  }
}
