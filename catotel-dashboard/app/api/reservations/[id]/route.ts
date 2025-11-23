import { NextResponse } from 'next/server';
import { backendRequest } from '@/lib/server/backend-client';
import { getAccessTokenFromCookies } from '@/lib/server/auth-cookies';
import { handleApiError } from '@/lib/server/api-error-response';

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reservation = await backendRequest(
      {
        method: 'GET',
        url: `/reservations/${params.id}`,
      },
      token,
    );
    return NextResponse.json(reservation);
  } catch (error) {
    return handleApiError(error);
  }
}
