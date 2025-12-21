export const dynamic = "force-dynamic";

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
    const service = await backendRequestWithRefresh({
      method: "PATCH",
      url: `/admin/addon-services/${params.id}`,
      body,
      mediaType: "application/json",
    });
    return NextResponse.json(service);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    await backendRequestWithRefresh({
      method: "DELETE",
      url: `/admin/addon-services/${params.id}`,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
