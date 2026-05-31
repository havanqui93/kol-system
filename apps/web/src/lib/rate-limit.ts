import { redis } from "./redis";
import { NextResponse } from "next/server";

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const { windowMs, max, keyPrefix } = options;
  const key = `rl:${keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, "-inf", windowStart);
  pipeline.zadd(key, now, `${now}`);
  pipeline.zcard(key);
  pipeline.pexpire(key, windowMs);

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;
  const allowed = count <= max;
  const resetAt = now + windowMs;

  return {
    allowed,
    remaining: Math.max(0, max - count),
    resetAt,
  };
}

export async function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const userId = request.headers.get("x-user-id") ?? "anon";
  const { allowed, remaining, resetAt } = await rateLimit(userId, options);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before retrying.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

// Preset configs for different operation types
export const RATE_LIMITS = {
  generateScript: { windowMs: 60_000, max: 5, keyPrefix: "gen-script" },
  generateAudio: { windowMs: 60_000, max: 10, keyPrefix: "gen-audio" },
  generateKling: { windowMs: 60_000, max: 3, keyPrefix: "gen-kling" },
  createProject: { windowMs: 60_000, max: 20, keyPrefix: "create-project" },
} as const;
