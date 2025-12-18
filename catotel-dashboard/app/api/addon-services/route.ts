export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";

export async function GET() {
  try {
    const services = await backendRequestWithRefresh({
      method: "GET",
      url: "/addon-services",
    });
    return NextResponse.json(services);
  } catch (error) {
    return handleApiError(error);
  }
}
