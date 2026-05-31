import { describe, expect, it, vi } from "vitest";
import { CircuitBreaker } from "../circuit-breaker";

describe("CircuitBreaker", () => {
  it("starts in closed state", () => {
    const cb = new CircuitBreaker({ name: "test" });
    expect(cb.currentState).toBe("closed");
  });

  it("executes functions successfully in closed state", async () => {
    const cb = new CircuitBreaker({ name: "test" });
    const result = await cb.execute(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it("opens after failure threshold", async () => {
    const cb = new CircuitBreaker({ name: "test", failureThreshold: 2 });
    const fail = () => Promise.reject(new Error("fail"));

    await cb.execute(fail).catch(() => {});
    await cb.execute(fail).catch(() => {});

    expect(cb.currentState).toBe("open");
  });

  it("rejects calls in open state", async () => {
    const cb = new CircuitBreaker({ name: "test", failureThreshold: 1 });
    await cb.execute(() => Promise.reject(new Error("fail"))).catch(() => {});

    await expect(cb.execute(() => Promise.resolve(1))).rejects.toThrow("OPEN");
  });

  it("resets to closed state", () => {
    const cb = new CircuitBreaker({ name: "test", failureThreshold: 1 });
    cb.reset();
    expect(cb.currentState).toBe("closed");
  });

  it("returns stats object", () => {
    const cb = new CircuitBreaker({ name: "test-stats" });
    const stats = cb.getStats();
    expect(stats.name).toBe("test-stats");
    expect(stats.state).toBe("closed");
    expect(stats.failures).toBe(0);
  });
});
