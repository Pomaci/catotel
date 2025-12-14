import {
  OpenAPI as GeneratedOpenAPI,
  request as apiRequest,
  type OpenAPIConfig,
  type ApiRequestOptions,
} from '@catotel/api-client';

const API_BASE =
  process.env.API_BASE_URL?.trim() || 'http://localhost:3000/api/v1';

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
