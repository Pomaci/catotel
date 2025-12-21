"use server";

import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";
import { requireCsrfToken } from "@/lib/server/csrf";

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  try {
    const cat = await backendRequestWithRefresh({
      method: "GET",
      url: `/admin/cats/${params.id}`,
    });
    return NextResponse.json(cat);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json();
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }
  try {
    const cat = await backendRequestWithRefresh({
      method: "PATCH",
      url: `/admin/cats/${params.id}`,
      body,
    });
    return NextResponse.json(cat);
  } catch (error) {
    return handleApiError(error);
  }
}
