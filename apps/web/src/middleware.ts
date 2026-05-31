import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  const response = NextResponse.next();

  response.headers.set("x-request-id", requestId);
  response.headers.set("x-powered-by", "KOL System");
  response.headers.set("x-response-time", `${Date.now() - start}ms`);

  // Log slow API requests (>500ms) to console for observability
  const elapsed = Date.now() - start;
  if (elapsed > 500) {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "slow_api_request",
        method: request.method,
        path: request.nextUrl.pathname,
        requestId,
        elapsedMs: elapsed,
        ts: new Date().toISOString(),
      })
    );
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
