import { API_BASE } from "./env";
import type { AuthTokens } from "@/types/auth";
import { clearTokens } from "@/lib/storage";

let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;
let refreshInFlight: Promise<AuthTokens | null> | null = null;
let tokensUpdatedListener:
  | ((tokens: AuthTokens | null) => Promise<void> | void)
  | null = null;
let consecutiveAuthFailures = 0;

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

type RequestOptions = {
  method?: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  { method, body, headers, auth = true }: RequestOptions = {},
): Promise<T> {
  const resolvedMethod = method ?? (body ? "POST" : "GET");

  const buildHeaders = () => {
    const requestHeaders: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    };
    if (auth && currentAccessToken) {
      requestHeaders.Authorization = `Bearer ${currentAccessToken}`;
    }
    return requestHeaders;
  };

  const doFetch = async () => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: resolvedMethod,
      headers: buildHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    const data = text ? (JSON.parse(text) as unknown) : null;
    return { response, data };
  };

  let { response, data } = await doFetch();

  const refreshed =
    response.status === 401 &&
    auth &&
    !path.includes("/auth/refresh") &&
    (await refreshTokens());

  if (refreshed) {
    ({ response, data } = await doFetch());
  }

  if (response.status === 401 && !refreshed) {
    consecutiveAuthFailures += 1;
    if (consecutiveAuthFailures >= 2) {
      await handleRefreshFailure();
    }
  } else {
    consecutiveAuthFailures = 0;
  }

  if (!response.ok || response.status === 401) {
    const message =
      (data &&
        typeof (data as any).message === "string" &&
        (data as any).message) ||
      (data &&
        typeof (data as any).error === "string" &&
        (data as any).error) ||
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

async function refreshTokens(): Promise<AuthTokens | null> {
  if (!currentRefreshToken) {
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: currentRefreshToken }),
        });

        const text = await response.text();
        const data = text ? (JSON.parse(text) as unknown) : null;
        if (!response.ok || !data) {
          return null;
        }

        const tokens = data as AuthTokens;
        setApiTokens(tokens.access_token, tokens.refresh_token);
        await notifyTokens(tokens);
        return tokens;
      } catch {
        await handleRefreshFailure();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function handleRefreshFailure() {
  currentAccessToken = null;
  currentRefreshToken = null;
  await clearTokens();
  await notifyTokens(null);
}
