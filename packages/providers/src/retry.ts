export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  retryOn?: (error: unknown) => boolean;
}

const DEFAULT_RETRY_ON = (err: unknown) => {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // Retry on rate limits, server errors, and transient network issues
    return (
      msg.includes("rate limit") ||
      msg.includes("overloaded") ||
      msg.includes("timeout") ||
      msg.includes("network") ||
      msg.includes("econnreset") ||
      msg.includes("econnrefused") ||
      msg.includes("503") ||
      msg.includes("502") ||
      msg.includes("529")
    );
  }
  return false;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    factor = 2,
    retryOn = DEFAULT_RETRY_ON,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === maxAttempts || !retryOn(err)) {
        throw err;
      }

      const delay = Math.min(initialDelayMs * Math.pow(factor, attempt - 1), maxDelayMs);
      const jitter = Math.random() * delay * 0.1;
      await sleep(delay + jitter);
    }
  }

  throw lastError;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
