"use server";

import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";
import { requireCsrfToken } from "@/lib/server/csrf";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const cats = await backendRequestWithRefresh(
      {
        method: "GET",
        url: `/customers/${params.id}/cats`,
      },
    );
    return NextResponse.json(cats);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }
  const body = await request.json();
  try {
    const cat = await backendRequestWithRefresh(
      {
        method: "POST",
        url: `/customers/${params.id}/cats`,
        body,
        mediaType: "application/json",
      },
    );
    return NextResponse.json(cat, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
