"use server";

import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  try {
    const results = await backendRequestWithRefresh(
      {
        method: "GET",
        url: "/users/customers/search",
        query: q ? { q } : undefined,
      },
    );
    return NextResponse.json(results);
  } catch (error) {
    return handleApiError(error);
  }
}
