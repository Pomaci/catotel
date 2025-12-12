const CSRF_COOKIE = 'catotel_csrf';

function readClientCsrfToken() {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
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

  const response = await fetch(applyQuery(path, query), {
    ...restInit,
    headers,
    credentials: 'include',
  });
  if (
    response.status === 401 &&
    options?.retry !== false &&
    !path.endsWith('/api/auth/refresh')
  ) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return clientRequest<T>(path, init, { ...options, retry: false });
    }
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
