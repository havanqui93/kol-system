import { NextResponse } from "next/server";
import { z } from "zod";

export interface ApiErrorBody {
  error: string;
  code?: string;
  details?: unknown;
}

export function apiError(message: string, status: number, opts?: { code?: string; details?: unknown }) {
  const body: ApiErrorBody = { error: message, ...opts };
  return NextResponse.json(body, { status });
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof z.ZodError) {
    return apiError("Validation error", 400, { code: "VALIDATION_ERROR", details: err.issues });
  }

  if (err instanceof Error) {
    if (err.message.includes("Not found") || err.message.includes("not found")) {
      return apiError(err.message, 404, { code: "NOT_FOUND" });
    }
    if (err.message.includes("Budget exceeded")) {
      return apiError(err.message, 402, { code: "BUDGET_EXCEEDED" });
    }
    if (err.message.includes("already being processed")) {
      return apiError(err.message, 409, { code: "CONFLICT" });
    }
  }

  console.error("[api-error]", err);
  return apiError("Internal server error", 500, { code: "INTERNAL_ERROR" });
}
