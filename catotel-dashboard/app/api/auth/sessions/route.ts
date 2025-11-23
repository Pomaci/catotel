import { NextResponse } from 'next/server';
import { backendSessions } from '@/lib/server/backend-auth';
import { getAccessTokenFromCookies } from '@/lib/server/auth-cookies';
import { handleApiError } from '@/lib/server/api-error-response';

export async function GET() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions = await backendSessions(token);
    return NextResponse.json(sessions);
  } catch (error) {
    return handleApiError(error);
  }
}
