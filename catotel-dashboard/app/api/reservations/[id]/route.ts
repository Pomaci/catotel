"use server";

import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";
import { requireCsrfToken } from "@/lib/server/csrf";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const body = await request.json();

  try {
    const updated = await backendRequestWithRefresh(
      {
        method: "PATCH",
        url: `/reservations/${params.id}`,
        body,
        mediaType: "application/json",
      },
    );
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const reservation = await backendRequestWithRefresh(
      {
        method: "GET",
        url: `/reservations/${params.id}`,
      },
    );
    return NextResponse.json(reservation);
  } catch (error) {
    return handleApiError(error);
  }
}
