import { NextResponse } from 'next/server';
import { backendRequestWithRefresh } from '@/lib/server/backend-auth-refresh';
import { handleApiError } from '@/lib/server/api-error-response';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const reservation = await backendRequestWithRefresh(
      {
        method: 'GET',
        url: `/reservations/${params.id}`,
      },
    );
    return NextResponse.json(reservation);
  } catch (error) {
    return handleApiError(error);
  }
}
