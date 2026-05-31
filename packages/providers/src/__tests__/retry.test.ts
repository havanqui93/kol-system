import { test, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { withRetry } from "../retry.js";

describe("withRetry", () => {
  it("returns result on first success", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      return "ok";
    }, { maxAttempts: 3, initialDelayMs: 0 });

    assert.equal(result, "ok");
    assert.equal(calls, 1);
  });

  it("retries on retryable errors and succeeds", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) throw new Error("rate limit exceeded");
        return "success";
      },
      { maxAttempts: 3, initialDelayMs: 0, retryOn: () => true }
    );

    assert.equal(result, "success");
    assert.equal(calls, 3);
  });

  it("throws after maxAttempts exhausted", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        withRetry(
          async () => {
            calls++;
            throw new Error("persistent failure");
          },
          { maxAttempts: 3, initialDelayMs: 0, retryOn: () => true }
        ),
      /persistent failure/
    );
    assert.equal(calls, 3);
  });

  it("does not retry on non-retryable errors", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        withRetry(
          async () => {
            calls++;
            throw new Error("validation error");
          },
          { maxAttempts: 3, initialDelayMs: 0, retryOn: () => false }
        ),
      /validation error/
    );
    assert.equal(calls, 1);
  });

  it("applies default retryOn to rate limit errors", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls === 1) throw new Error("rate limit exceeded");
        return "done";
      },
      { maxAttempts: 3, initialDelayMs: 0 }
    );
    assert.equal(result, "done");
    assert.equal(calls, 2);
  });
});
