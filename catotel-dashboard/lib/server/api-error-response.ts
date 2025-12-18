import { NextResponse } from 'next/server';
import { ApiError } from '@catotel/api-client';
import {
  isLocalizedErrorMessage,
  type LocalizedErrorMessage,
} from '@catotel/i18n';

type ApiErrorBody = {
  message?: string | string[] | LocalizedErrorMessage;
  localizedMessage?: LocalizedErrorMessage;
  error?: string;
  errors?: string[];
};

type ApiErrorShape = {
  status?: number;
  body?: ApiErrorBody;
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

type NormalizedErrorMessage = {
  message: string;
  localizedMessage?: LocalizedErrorMessage;
  validationErrors?: string[];
};

function extractMessage(body?: ApiErrorBody): NormalizedErrorMessage {
  const fallback = 'Unexpected backend error';
  if (!body) {
    return { message: fallback };
  }
  let validationErrors: string[] | undefined;
  let localized: LocalizedErrorMessage | undefined;
  let resolved = fallback;
  const raw = body.message ?? body.error;

  if (Array.isArray(raw)) {
    validationErrors = raw.map((value) => String(value));
    resolved = validationErrors.join(', ');
  } else if (isLocalizedErrorMessage(raw)) {
    localized = raw;
    resolved = raw.message;
  } else if (typeof raw === 'string' && raw.trim().length > 0) {
    resolved = raw;
  }

  if (!localized && isLocalizedErrorMessage(body.localizedMessage)) {
    localized = body.localizedMessage;
    resolved = localized.message;
  }

  if (!validationErrors && Array.isArray(body.errors)) {
    validationErrors = body.errors.map((value) => String(value));
  }

  if (!resolved && typeof body.error === 'string' && body.error.trim()) {
    resolved = body.error;
  }

  return {
    message: resolved || fallback,
    localizedMessage: localized,
    validationErrors,
  };
}

export function handleApiError(error: unknown) {
  const payload = resolveErrorPayload(error);
  if (payload) {
    const status = payload.status ?? 500;
    const normalized = extractMessage(payload.body);
    return NextResponse.json(
      {
        message: normalized.message,
        errorCode: normalized.localizedMessage?.code,
        localizedMessage: normalized.localizedMessage,
        validationErrors: normalized.validationErrors,
      },
      { status },
    );
  }

  console.error('Unhandled error', error);
  return NextResponse.json(
    { message: 'Internal server error' },
    { status: 500 },
  );
}
