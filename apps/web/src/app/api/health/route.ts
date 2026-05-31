import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

async function timed<T>(fn: () => Promise<T>): Promise<{ result?: T; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const result = await fn();
    return { result, latencyMs: Date.now() - start };
  } catch (e) {
    return { latencyMs: Date.now() - start, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function GET() {
  const [db, redisCheck] = await Promise.all([
    timed(() => prisma.$queryRaw`SELECT 1`),
    timed(() => redis.ping()),
  ]);

  const providers = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    fal: !!process.env.FAL_KEY,
    r2: !!process.env.R2_ACCESS_KEY_ID,
    openai: !!process.env.OPENAI_API_KEY,
  };

  const healthy = !db.error && !redisCheck.error;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      checks: {
        database: { status: db.error ? "error" : "ok", latencyMs: db.latencyMs, error: db.error },
        redis: { status: redisCheck.error ? "error" : "ok", latencyMs: redisCheck.latencyMs, error: redisCheck.error },
      },
      providers,
    },
    { status: healthy ? 200 : 503 }
  );
}
