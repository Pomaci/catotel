import {
  ApiError,
  OpenAPI as GeneratedOpenAPI,
  request as generatedRequest,
  type ApiRequestOptions,
  type OpenAPIConfig,
} from '@catotel/api-client';
import type { AuthTokens } from '@/types/auth';
import { API_BASE } from './env';
import { clearTokens } from '@/lib/storage';

let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;
let refreshInFlight: Promise<AuthTokens | null> | null = null;
let tokensUpdatedListener:
  | ((tokens: AuthTokens | null) => Promise<void> | void)
  | null = null;
let consecutiveAuthFailures = 0;

const baseConfig: OpenAPIConfig = {
  ...GeneratedOpenAPI,
  BASE: API_BASE,
  WITH_CREDENTIALS: false,
  CREDENTIALS: 'omit',
};

type RequestConfig = {
  auth?: boolean;
  retry?: boolean;
};

export function setApiAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function setApiTokens(
  accessToken: string | null,
  refreshToken: string | null,
) {
  currentAccessToken = accessToken;
  currentRefreshToken = refreshToken;
}

export function onTokensUpdated(
  listener: ((tokens: AuthTokens | null) => Promise<void> | void) | null,
) {
  tokensUpdatedListener = listener;
}

async function notifyTokens(tokens: AuthTokens | null) {
  if (tokensUpdatedListener) {
    await tokensUpdatedListener(tokens);
  }
}

export function getApiAccessToken() {
  return currentAccessToken;
}

export async function apiRequest<T>(
  options: ApiRequestOptions,
  config: RequestConfig = {},
): Promise<T> {
  const { auth = true, retry = true } = config;
  try {
    const result = await executeRequest<T>(options, auth);
    consecutiveAuthFailures = 0;
    return result;
  } catch (error) {
    if (auth && error instanceof ApiError && error.status === 401) {
      const refreshed = retry && (await refreshTokens());
      if (refreshed) {
        consecutiveAuthFailures = 0;
        return apiRequest<T>(options, { auth, retry: false });
      }
      consecutiveAuthFailures += 1;
      if (consecutiveAuthFailures >= 2) {
        await handleRefreshFailure();
      }
    }
    throw normalizeError(error);
  }
}

async function executeRequest<T>(
  options: ApiRequestOptions,
  auth: boolean,
): Promise<T> {
  const config: OpenAPIConfig = {
    ...baseConfig,
    TOKEN: auth
      ? async () => (currentAccessToken ? currentAccessToken : '')
      : undefined,
  };
  try {
    return await generatedRequest<T>(config, options);
  } catch (err) {
    throw normalizeError(err);
  }
}

async function refreshTokens(): Promise<AuthTokens | null> {
  if (!currentRefreshToken) {
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const tokens = await executeRequest<AuthTokens>(
          {
            method: 'POST',
            url: '/auth/refresh',
            body: { refresh_token: currentRefreshToken },
            mediaType: 'application/json',
          },
          false,
        );
        setApiTokens(tokens.access_token, tokens.refresh_token);
        await notifyTokens(tokens);
        return tokens;
      } catch (error) {
        await handleRefreshFailure();
        throw error;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  try {
    return await refreshInFlight;
  } catch {
    return null;
  }
}

async function handleRefreshFailure() {
  currentAccessToken = null;
  currentRefreshToken = null;
  await clearTokens();
  await notifyTokens(null);
}

function normalizeError(error: unknown) {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string; error?: string };
    const message =
      (body && typeof body.message === 'string' && body.message) ||
      (body && typeof body.error === 'string' && body.error) ||
      `HTTP ${error.status}`;
    return new Error(message);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('Beklenmeyen bir ağ hatası oluştu.');
}

