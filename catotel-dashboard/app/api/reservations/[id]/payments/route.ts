import { NextResponse } from 'next/server';
import { backendRequestWithRefresh } from '@/lib/server/backend-auth-refresh';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const body = await request.json();

  try {
    const reservation = await backendRequestWithRefresh(
      {
        method: 'POST',
        url: `/reservations/${params.id}/payments`,
        body,
        mediaType: 'application/json',
      },
    );
    return NextResponse.json(reservation);
  } catch (error) {
    return handleApiError(error);
  }
}
