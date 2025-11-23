import { NextRequest, NextResponse } from "next/server";
import { backendLogin } from "@/lib/server/backend-auth";
import { handleApiError } from "@/lib/server/api-error-response";
import { setAuthCookies } from "@/lib/server/auth-cookies";
import { ensureCsrfToken, requireCsrfToken } from "@/lib/server/csrf";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { message: "Email ve şifre zorunludur." },
      { status: 400 }
    );
  }

  const csrfError = requireCsrfToken(request);
  if (csrfError) {
    return csrfError;
  }

  try {
    const response = await backendLogin({
      email: body.email,
      password: body.password,
    });
    console.log(response);
    setAuthCookies(response);
    ensureCsrfToken();
    return NextResponse.json({ user: response.user });
  } catch (error) {
    return handleApiError(error);
  }
}
