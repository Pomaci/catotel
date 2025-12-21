'use client';

type ReportExtras = {
  digest?: string;
};

export type TelemetryEventType = 'CLIENT_ERROR' | 'NETWORK_ERROR' | 'AUTH_REFRESH_LOOP';

type TelemetryPayload = {
  type: TelemetryEventType;
  message: string;
  severity?: 'info' | 'warn' | 'error';
  stack?: string;
  digest?: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
  timestamp: string;
};

const TELEMETRY_ENDPOINT = '/api/monitoring/client-error';

function enrichPayload(event: Omit<TelemetryPayload, 'userAgent' | 'url' | 'timestamp'>): TelemetryPayload {
  return {
    ...event,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
  };
}

async function deliverTelemetry(body: string) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const queued = navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
      if (queued) {
        return;
      }
    }
  } catch (err) {
    console.error('Failed to enqueue telemetry via sendBeacon', err);
  }

  try {
    await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      credentials: 'include',
      keepalive: true,
    });
  } catch (err) {
    console.error('Failed to deliver telemetry event', err);
  }
}

export async function reportTelemetryEvent(
  event: Omit<TelemetryPayload, 'userAgent' | 'url' | 'timestamp'>,
) {
  if (typeof window === 'undefined') {
    return;
  }
  const payload = enrichPayload(event);
  await deliverTelemetry(JSON.stringify(payload));
}

export async function reportClientError(error: Error, extras?: ReportExtras) {
  await reportTelemetryEvent({
    type: 'CLIENT_ERROR',
    message: error?.message ?? 'Unknown error',
    stack: error?.stack,
    digest: extras?.digest,
    severity: 'error',
  });
}
