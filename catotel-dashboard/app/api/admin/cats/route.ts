"use server";

import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";
import { requireCsrfToken } from "@/lib/server/csrf";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (value !== undefined && value !== null) {
      query[key] = value;
    }
  }

  try {
    const cats = await backendRequestWithRefresh({
      method: "GET",
      url: "/admin/cats",
      query,
    });
    return NextResponse.json(cats);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }
  try {
    const cat = await backendRequestWithRefresh({
      method: "POST",
      url: "/admin/cats",
      body,
    });
    return NextResponse.json(cat);
  } catch (error) {
    return handleApiError(error);
  }
}
