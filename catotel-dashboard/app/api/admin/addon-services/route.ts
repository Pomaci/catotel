import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";
import { requireCsrfToken } from "@/lib/server/csrf";

export async function GET() {
  try {
    const services = await backendRequestWithRefresh({
      method: "GET",
      url: "/admin/addon-services",
    });
    return NextResponse.json(services);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const body = await request.json();
  try {
    const service = await backendRequestWithRefresh({
      method: "POST",
      url: "/admin/addon-services",
      body,
      mediaType: "application/json",
    });
    return NextResponse.json(service);
  } catch (error) {
    return handleApiError(error);
  }
}
