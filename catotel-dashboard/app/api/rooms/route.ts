import { NextResponse } from 'next/server';
import { backendRequest } from '@/lib/server/backend-client';
import { handleApiError } from '@/lib/server/api-error-response';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';

  try {
    const rooms = await backendRequest({
      method: 'GET',
      url: '/rooms',
      query: includeInactive ? { includeInactive: 'true' } : undefined,
    });
    return NextResponse.json(rooms);
  } catch (error) {
    return handleApiError(error);
  }
}
