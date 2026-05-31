import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security headers applied to all API and page responses
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https:",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
  ].join("; "),
};

export function middleware(request: NextRequest) {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  const isApi = request.nextUrl.pathname.startsWith("/api");

  const response = NextResponse.next();

  // Apply security headers to all responses
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  if (isApi) {
    response.headers.set("x-request-id", requestId);
    response.headers.set("x-powered-by", "KOL System");

    // CORS for API routes — allow same-origin only (adjust for public API)
    const origin = request.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    if (origin && origin === appUrl) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    // Handle pre-flight
    if (request.method === "OPTIONS") {
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, x-user-id, x-request-id");
      response.headers.set("Access-Control-Max-Age", "86400");
    }
  }

  const elapsed = Date.now() - start;

  if (isApi) {
    response.headers.set("x-response-time", `${elapsed}ms`);

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
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
