import { NextResponse } from 'next/server';
import { backendRequestWithRefresh } from '@/lib/server/backend-auth-refresh';
import { handleApiError } from '@/lib/server/api-error-response';
import { requireCsrfToken } from '@/lib/server/csrf';

export async function GET() {
  try {
    const cats = await backendRequestWithRefresh(
      {
        method: 'GET',
        url: '/customers/cats',
      },
    );
    return NextResponse.json(cats);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const body = await request.json();

  try {
    const cat = await backendRequestWithRefresh(
      {
        method: 'POST',
        url: '/customers/cats',
        body,
        mediaType: 'application/json',
      },
    );
    return NextResponse.json(cat);
  } catch (error) {
    return handleApiError(error);
  }
}
