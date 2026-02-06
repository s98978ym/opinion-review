import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that checks for auth session cookie.
// We avoid importing auth() here to prevent Node.js crypto module
// from being loaded in the Edge Runtime.
export function middleware(request: NextRequest) {
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
