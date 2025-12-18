'use client';

type ReportExtras = {
  digest?: string;
};

type ClientErrorPayload = {
  message: string;
  stack?: string;
  digest?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
};

function buildPayload(error: Error, extras?: ReportExtras): ClientErrorPayload {
  return {
    message: error?.message ?? 'Unknown error',
    stack: error?.stack,
    digest: extras?.digest,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
  };
}

export async function reportClientError(error: Error, extras?: ReportExtras) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = buildPayload(error, extras);
  const body = JSON.stringify(payload);
  const endpoint = '/api/monitoring/client-error';

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const queued = navigator.sendBeacon(endpoint, blob);
      if (queued) {
        return;
      }
    }
  } catch (err) {
    console.error('Failed to enqueue error report via sendBeacon', err);
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      credentials: 'include',
      keepalive: true,
    });
  } catch (err) {
    console.error('Failed to deliver client error report', err);
  }
}
