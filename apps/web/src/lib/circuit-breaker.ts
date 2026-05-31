// Simple circuit breaker for protecting against provider failures

export type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerOptions {
  failureThreshold?: number;   // failures before opening
  successThreshold?: number;   // successes in half-open to close
  timeout?: number;            // ms before moving open → half-open
  name?: string;
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;
  readonly name: string;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.successThreshold = opts.successThreshold ?? 2;
    this.timeout = opts.timeout ?? 60_000;
    this.name = opts.name ?? "default";
  }

  get currentState(): CircuitState {
    if (this.state === "open" && Date.now() - this.lastFailureTime >= this.timeout) {
      this.state = "half-open";
      this.successes = 0;
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.currentState;

    if (state === "open") {
      throw new Error(`Circuit breaker [${this.name}] is OPEN — service unavailable`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state === "half-open") {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.state = "closed";
        this.successes = 0;
      }
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = "open";
    }
  }

  getStats() {
    return {
      name: this.name,
      state: this.currentState,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
    };
  }

  reset() {
    this.state = "closed";
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }
}

// Global breaker registry
const BREAKERS = new Map<string, CircuitBreaker>();

export function getBreaker(name: string, opts?: CircuitBreakerOptions): CircuitBreaker {
  if (!BREAKERS.has(name)) {
    BREAKERS.set(name, new CircuitBreaker({ ...opts, name }));
  }
  return BREAKERS.get(name)!;
}

export function getAllBreakerStats() {
  return Array.from(BREAKERS.values()).map((b) => b.getStats());
}
