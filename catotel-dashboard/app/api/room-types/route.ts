import { NextResponse } from 'next/server';
import { backendRequestWithRefresh } from '@/lib/server/backend-auth-refresh';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const checkIn = searchParams.get('checkIn') ?? undefined;
  const checkOut = searchParams.get('checkOut') ?? undefined;
  const partySize = searchParams.get('partySize') ?? undefined;

  try {
    const roomTypes = await backendRequestWithRefresh({
      method: 'GET',
      url: '/room-types',
      query:
        checkIn && checkOut
          ? {
              includeInactive: includeInactive ? 'true' : undefined,
              checkIn,
              checkOut,
              partySize,
            }
          : includeInactive
            ? { includeInactive: 'true' }
            : undefined,
    });
    return NextResponse.json(roomTypes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const body = await request.json();
  try {
    const roomType = await backendRequestWithRefresh({
      method: 'POST',
      url: '/room-types',
      body,
      mediaType: 'application/json',
    });
    return NextResponse.json(roomType, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
