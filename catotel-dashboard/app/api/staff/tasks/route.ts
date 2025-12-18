export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { backendRequestWithRefresh } from '@/lib/server/backend-auth-refresh';
import { handleApiError } from '@/lib/server/api-error-response';

export async function GET() {
  try {
    const tasks = await backendRequestWithRefresh(
      {
        method: 'GET',
        url: '/staff/tasks',
      },
    );
    return NextResponse.json(tasks);
  } catch (error) {
    return handleApiError(error);
  }
}
