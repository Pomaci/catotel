 "use server";

import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { UserRole } from "@catotel/api-client";
import { backendRequestWithRefresh } from "@/lib/server/backend-auth-refresh";
import { handleApiError } from "@/lib/server/api-error-response";
import { requireCsrfToken } from "@/lib/server/csrf";
import { getAccessTokenFromCookies } from "@/lib/server/auth-cookies";

function authorize(requiredRoles: UserRole[]) {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  try {
    const payload = jwtDecode<{ role?: UserRole }>(token);
    if (payload.role && requiredRoles.includes(payload.role)) {
      return { token };
    }
    return { error: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  } catch {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
}

export async function GET() {
  const auth = authorize([UserRole.ADMIN, UserRole.MANAGER]);
  if (auth.error) {
    return auth.error;
  }
  try {
    const users = await backendRequestWithRefresh(
      {
        method: "GET",
        url: "/users",
      },
    );
    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const auth = authorize([UserRole.ADMIN, UserRole.MANAGER]);
  if (auth.error) {
    return auth.error;
  }
  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  const body = await request.json();

  try {
    const created = await backendRequestWithRefresh(
      {
        method: "POST",
        url: "/users/management",
        body,
        mediaType: "application/json",
      },
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
