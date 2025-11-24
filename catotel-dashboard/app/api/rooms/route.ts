import { NextResponse } from 'next/server';
import { backendRequestWithRefresh } from '@/lib/server/backend-auth-refresh';
import { handleApiError } from '@/lib/server/api-error-response';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';

  try {
    const rooms = await backendRequestWithRefresh({
      method: 'GET',
      url: '/rooms',
      query: includeInactive ? { includeInactive: 'true' } : undefined,
    });
    return NextResponse.json(rooms);
  } catch (error) {
    return handleApiError(error);
  }
}
