import type { ZodError } from "zod";
import { NextResponse } from "next/server";

export interface FieldError {
  field: string;
  message: string;
}

export function formatZodError(err: ZodError): FieldError[] {
  return err.issues.map((issue) => ({
    field: issue.path.join(".") || "_root",
    message: issue.message,
  }));
}

export function zodErrorResponse(err: ZodError) {
  return NextResponse.json(
    {
      error: "Validation error",
      fields: formatZodError(err),
    },
    { status: 422 }
  );
}
