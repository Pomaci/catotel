import { reportTelemetryEvent } from '@/lib/utils/client-error-reporter';

const CSRF_COOKIE = 'catotel_csrf';
const UNAUTHORIZED_THRESHOLD = 2;

let unauthorizedRequestCount = 0;
let forcedLogoutPromise: Promise<void> | null = null;

function readClientCsrfToken() {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function normalizePath(path: string) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      return new URL(path).pathname;
    } catch {
      return path;
    }
  }
  return path;
}

function shouldTrackUnauthorized(path: string) {
  const normalized = normalizePath(path);
  return normalized.startsWith('/api/') && !normalized.startsWith('/api/auth/');
}

async function ensureCsrfTokenForLogout() {
  const existing = readClientCsrfToken();
  if (existing) {
    return existing;
  }
  try {
    await fetch('/api/auth/csrf', { credentials: 'include' });
  } catch (err) {
    console.error('Failed to renew CSRF token before logout', err);
    return null;
  }
  return readClientCsrfToken();
}

async function attemptSessionCleanup() {
  const csrfToken = await ensureCsrfTokenForLogout();
  if (!csrfToken) {
    return;
  }
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include',
    });
  } catch (err) {
    console.error('Failed to clear auth cookies after repeated 401', err);
  }
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }
  const loginUrl = new URL('/auth/login', window.location.origin);
  const from = `${window.location.pathname || ''}${window.location.search || ''}`;
  if (window.location.pathname && window.location.pathname !== '/auth/login') {
    loginUrl.searchParams.set('from', from || '/');
  }
  window.location.assign(loginUrl.toString());
}

async function forceLogoutAfterRepeatedUnauthorized(path?: string) {
  if (typeof window === 'undefined') {
    return;
  }
  if (!forcedLogoutPromise) {
    void reportTelemetryEvent({
      type: 'AUTH_REFRESH_LOOP',
      severity: 'warn',
      message: 'Repeated unauthorized responses triggered forced logout.',
      context: { path },
    });
    forcedLogoutPromise = (async () => {
      await attemptSessionCleanup();
      redirectToLogin();
    })().finally(() => {
      forcedLogoutPromise = null;
    });
  }
  await forcedLogoutPromise;
}

async function parseBody(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

type ClientRequestInit = RequestInit & {
  query?:
    | Record<
        string,
        | string
        | number
        | boolean
        | null
        | undefined
        | Array<string | number | boolean | null | undefined>
      >
    | URLSearchParams;
};

export async function clientRequest<T>(
  path: string,
  init: ClientRequestInit = {},
  options?: { csrf?: boolean; retry?: boolean },
) {
  const { query, ...restInit } = init;
  const normalizedPath = normalizePath(path);
  const isRefreshRequest = normalizedPath === '/api/auth/refresh';
  const headers = new Headers(restInit.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options?.csrf) {
    const csrfToken = readClientCsrfToken();
    if (!csrfToken) {
      throw new Error('CSRF token missing. Please refresh the page and try again.');
    }
    headers.set('X-CSRF-Token', csrfToken);
  }

  let response: Response;
  try {
    response = await fetch(applyQuery(path, query), {
      ...restInit,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    void reportTelemetryEvent({
      type: 'NETWORK_ERROR',
      severity: 'error',
      message: `Network request failed for ${normalizedPath || path}`,
      context: {
        path: normalizedPath || path,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
  if (
    response.status === 401 &&
    !isRefreshRequest
  ) {
    if (options?.retry !== false) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        unauthorizedRequestCount = 0;
        return clientRequest<T>(path, init, { ...options, retry: false });
      }
    }
    if (shouldTrackUnauthorized(normalizedPath)) {
      unauthorizedRequestCount += 1;
      if (unauthorizedRequestCount >= UNAUTHORIZED_THRESHOLD) {
        unauthorizedRequestCount = 0;
        await forceLogoutAfterRepeatedUnauthorized(normalizedPath);
      }
    } else {
      unauthorizedRequestCount = 0;
    }
  } else if (response.status !== 401) {
    unauthorizedRequestCount = 0;
  }

  if (!response.ok) {
    if (response.status === 403 && options?.csrf) {
      // Attempt to re-acquire CSRF token and retry once
      await fetch('/api/auth/csrf', { credentials: 'include' }).catch(() => {});
      const csrfToken = readClientCsrfToken();
      if (csrfToken && options?.retry !== false) {
        headers.set('X-CSRF-Token', csrfToken);
        return clientRequest<T>(
          path,
          { ...(init as ClientRequestInit), headers },
          { ...options, retry: false },
        );
      }
    }

    const payload = (await parseBody(response)) ?? {};
    const message =
      typeof payload.message === 'string'
        ? payload.message
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await parseBody(response)) as T;
}

async function tryRefresh() {
  const csrfToken = readClientCsrfToken();
  if (!csrfToken) {
    return false;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      credentials: 'include',
    });
    return response.ok;
  } catch (err) {
    console.error('Refresh attempt failed', err);
    void reportTelemetryEvent({
      type: 'NETWORK_ERROR',
      severity: 'warn',
      message: 'Refresh request failed',
      context: {
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return false;
  }
}

function applyQuery(
  path: string,
  query?:
    | Record<
        string,
        | string
        | number
        | boolean
        | null
        | undefined
        | Array<string | number | boolean | null | undefined>
      >
    | URLSearchParams,
) {
  if (!query) {
    return path;
  }
  const params =
    query instanceof URLSearchParams ? new URLSearchParams(query) : new URLSearchParams();

  if (!(query instanceof URLSearchParams)) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry === undefined || entry === null) return;
          params.append(key, String(entry));
        });
        return;
      }
      params.append(key, String(value));
    });
  }

  const queryString = params.toString();
  if (!queryString) {
    return path;
  }
  return path.includes('?') ? `${path}&${queryString}` : `${path}?${queryString}`;
}
