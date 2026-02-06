import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple proxy that checks for auth session cookie.
// proxy.ts runs on Node.js runtime in Next.js 16.
export function proxy(request: NextRequest) {
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/channels/:path*",
    "/history/:path*",
    "/search/:path*",
    "/settings/:path*",
  ],
};
