"use server";

import { NextResponse } from "next/server";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";

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
  try {
    const cat = await backendRequestWithRefresh(
      {
        method: "PATCH",
        url: `/admin/cats/${params.id}`,
        body,
      },
      { csrf: true },
    );
    return NextResponse.json(cat);
  } catch (error) {
    return handleApiError(error);
  }
}
