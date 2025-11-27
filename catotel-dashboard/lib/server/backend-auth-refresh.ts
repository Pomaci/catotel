import {
  ApiError,
  type ApiRequestOptions,
  type AuthTokensDto,
} from '@catotel/api-client';
import { backendRequest } from './backend-client';
import {
  clearAuthCookies,
  getAccessTokenFromCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from './auth-cookies';
import { ensureCsrfToken } from './csrf';

const unauthorizedError = {
  status: 401,
  body: { message: 'Unauthorized' },
};

export async function backendRequestWithRefresh<T>(
  options: ApiRequestOptions,
) {
  const accessToken = getAccessTokenFromCookies();
  const refreshToken = getRefreshTokenFromCookies();

  if (!accessToken && !refreshToken) {
    throw unauthorizedError;
  }

  if (accessToken) {
    try {
      return await backendRequest<T>(options, accessToken);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }
      // fall through to refresh below
    }
  }

  if (!refreshToken) {
    clearAuthCookies();
    throw unauthorizedError;
  }

  const newAccessToken = await refreshTokens(refreshToken);

  try {
    return await backendRequest<T>(options, newAccessToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthCookies();
    }
    throw error;
  }
}

async function refreshTokens(refreshToken: string) {
  try {
    const tokens = await backendRequest<AuthTokensDto>({
      method: 'POST',
      url: '/auth/refresh',
      body: { refresh_token: refreshToken },
      mediaType: 'application/json',
    });
    setAuthCookies(tokens);
    ensureCsrfToken();
    return tokens.access_token;
  } catch (error) {
    clearAuthCookies();
    throw error;
  }
}
