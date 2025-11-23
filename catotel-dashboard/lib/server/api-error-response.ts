import { NextResponse } from 'next/server';
import { ApiError } from '@catotel/api-client';

type ApiErrorShape = {
  status?: number;
  body?: {
    message?: string | string[];
    error?: string;
  };
};

function resolveErrorPayload(error: unknown): ApiErrorShape | null {
  if (error instanceof ApiError) {
    return { status: error.status, body: error.body };
  }
  if (error && typeof error === 'object') {
    const maybe = error as Record<string, unknown>;
    if ('status' in maybe || 'body' in maybe) {
      return {
        status: typeof maybe.status === 'number' ? maybe.status : undefined,
        body:
          typeof maybe.body === 'object' && maybe.body !== null
            ? (maybe.body as ApiErrorShape['body'])
            : undefined,
      };
    }
  }
  return null;
}

function extractMessage(body?: ApiErrorShape['body']) {
  if (!body) {
    return 'Unexpected backend error';
  }
  const raw = body.message ?? body.error;
  if (Array.isArray(raw)) {
    return raw.join(', ');
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw;
  }
  return 'Unexpected backend error';
}

export function handleApiError(error: unknown) {
  const payload = resolveErrorPayload(error);
  if (payload) {
    const status = payload.status ?? 500;
    return NextResponse.json(
      { message: extractMessage(payload.body) },
      { status },
    );
  }

  console.error('Unhandled error', error);
  return NextResponse.json(
    { message: 'Internal server error' },
    { status: 500 },
  );
}
