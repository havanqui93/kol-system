import { describe, expect, it } from "vitest";
import { z } from "zod";
import { handleApiError } from "../api-error";

describe("handleApiError", () => {
  it("handles Zod validation errors with 400", async () => {
    const schema = z.object({ name: z.string().min(1) });
    let zodErr: z.ZodError | null = null;
    try {
      schema.parse({});
    } catch (err) {
      if (err instanceof z.ZodError) zodErr = err;
    }

    const response = handleApiError(zodErr!);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("handles Not Found errors with 404", async () => {
    const err = new Error("Project not found");
    const response = handleApiError(err);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe("NOT_FOUND");
  });

  it("handles Budget Exceeded with 402", async () => {
    const err = new Error("Budget exceeded: spent $1.00 of $0.50 limit");
    const response = handleApiError(err);
    expect(response.status).toBe(402);
    const body = await response.json();
    expect(body.code).toBe("BUDGET_EXCEEDED");
  });

  it("handles conflict errors with 409", async () => {
    const err = new Error("Job is already being processed");
    const response = handleApiError(err);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.code).toBe("CONFLICT");
  });

  it("handles unknown errors with 500", async () => {
    const response = handleApiError(new Error("Unknown internal error"));
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe("INTERNAL_ERROR");
  });
});
