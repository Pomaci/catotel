import { NextResponse } from 'next/server';
import { backendRequestWithRefresh } from '@/lib/server/backend-auth-refresh';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const body = await request.json();
  try {
    const roomType = await backendRequestWithRefresh({
      method: 'PATCH',
      url: `/room-types/${params.id}`,
      body,
      mediaType: 'application/json',
    });
    return NextResponse.json(roomType);
  } catch (error) {
    return handleApiError(error);
  }
}
