import { NextResponse } from 'next/server';
import { ensureCsrfToken } from '@/lib/server/csrf';

export async function GET() {
  const token = ensureCsrfToken();
  return NextResponse.json({ token });
}
