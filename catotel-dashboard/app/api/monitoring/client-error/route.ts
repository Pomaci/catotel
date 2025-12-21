import { NextResponse } from 'next/server';

type TelemetryPayload = {
  type?: string;
  message?: string;
  severity?: string;
  stack?: string;
  digest?: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
  timestamp?: string;
};

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TelemetryPayload;
    const entry = {
      ...payload,
      receivedAt: new Date().toISOString(),
    };
    if (payload.severity === 'error') {
      console.error('Telemetry event', entry);
    } else {
      console.warn('Telemetry event', entry);
    }
  } catch (error) {
    console.error('Failed to process telemetry event', error);
  }

  return NextResponse.json({ ok: true });
}
