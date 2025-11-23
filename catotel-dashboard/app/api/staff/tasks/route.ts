import { NextResponse } from 'next/server';
import { backendRequest } from '@/lib/server/backend-client';
import { getAccessTokenFromCookies } from '@/lib/server/auth-cookies';
import { handleApiError } from '@/lib/server/api-error-response';

export async function GET() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tasks = await backendRequest(
      {
        method: 'GET',
        url: '/staff/tasks',
      },
      token,
    );
    return NextResponse.json(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}
