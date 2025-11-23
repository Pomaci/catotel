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

export async function clientRequest<T>(
  path: string,
  init: RequestInit = {},
  options?: { csrf?: boolean },
) {
  const headers = new Headers(init.headers || {});
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

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
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
