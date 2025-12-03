"use server";

import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";
import { requireCsrfToken } from "@/lib/server/csrf";

type Params = { params: { id: string } };

export async function DELETE(request: Request, { params }: Params) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }
  try {
    await backendRequestWithRefresh({
      method: "DELETE",
      url: `/admin/customers/${params.id}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
