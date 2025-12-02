import { NextResponse } from 'next/server';
import { backendRequestWithRefresh } from '@/lib/server/backend-auth-refresh';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const checkIn = searchParams.get('checkIn') ?? undefined;
  const checkOut = searchParams.get('checkOut') ?? undefined;

  try {
    const rooms = await backendRequestWithRefresh({
      method: 'GET',
      url: '/rooms',
      query:
        checkIn && checkOut
          ? {
              includeInactive: includeInactive ? 'true' : undefined,
              checkIn,
              checkOut,
            }
          : includeInactive
            ? { includeInactive: 'true' }
            : undefined,
    });
    return NextResponse.json(rooms);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const body = await request.json();
  try {
    const room = await backendRequestWithRefresh({
      method: 'POST',
      url: '/rooms',
      body,
      mediaType: 'application/json',
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
