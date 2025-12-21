import { NextResponse } from 'next/server';
import { backendRequestWithRefresh } from '@/lib/server/backend-auth-refresh';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const body = await request.json();

  try {
    const task = await backendRequestWithRefresh(
      {
        method: 'PATCH',
        url: `/staff/tasks/${params.id}/status`,
        body,
        mediaType: 'application/json',
      },
    );
    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error);
  }
}
