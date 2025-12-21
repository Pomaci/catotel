import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";
import { requireCsrfToken } from "@/lib/server/csrf";

export async function GET() {
  try {
    const profile = await backendRequestWithRefresh(
      {
        method: "GET",
        url: "/customers/me",
      },
    );
    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const body = await request.json();

  try {
    const updated = await backendRequestWithRefresh(
      {
        method: "PATCH",
        url: "/customers/me",
        body,
        mediaType: "application/json",
      },
    );
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
