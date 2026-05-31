import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const response = NextResponse.next();

  // Propagate request ID for tracing
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-powered-by", "KOL System");

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
