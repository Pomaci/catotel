import { OpenAPI as GeneratedOpenAPI } from '@catotel/api-client';
import type { OpenAPIConfig } from '@catotel/api-client/src/generated/core/OpenAPI';
import { request as apiRequest } from '@catotel/api-client/src/generated/core/request';
import type { ApiRequestOptions } from '@catotel/api-client/src/generated/core/ApiRequestOptions';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  'http://localhost:3000/api/v1';

const baseConfig: OpenAPIConfig = {
  ...GeneratedOpenAPI,
  BASE: API_BASE,
  WITH_CREDENTIALS: false,
  CREDENTIALS: 'omit',
};

export function backendRequest<T>(
  options: ApiRequestOptions,
  token?: string,
) {
  const config: OpenAPIConfig = {
    ...baseConfig,
    TOKEN: token ? async () => token : undefined,
  };
  return apiRequest(config, options) as Promise<T>;
}
