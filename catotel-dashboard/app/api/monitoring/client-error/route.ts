import { NextResponse } from 'next/server';

type ClientErrorPayload = {
  message?: string;
  stack?: string;
  digest?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
};

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ClientErrorPayload;
    console.error('Client error report received', {
      ...payload,
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to process client error report', error);
  }

  return NextResponse.json({ ok: true });
}
