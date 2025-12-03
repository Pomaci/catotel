"use server";

import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (value) query[key] = value;
  }

  try {
    const customers = await backendRequestWithRefresh({
      method: "GET",
      url: "/admin/customers",
      query,
    });
    return NextResponse.json(customers);
  } catch (error) {
    return handleApiError(error);
  }
}
