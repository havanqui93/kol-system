import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

export const dynamic = "force-dynamic";

// GET /api/health — checks DB + Redis connectivity + queue depths
export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};
  const errors: string[] = [];
  const queues: Record<string, number> = {};

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err) {
    checks.database = "error";
    errors.push(`DB: ${String(err)}`);
  }

  // Redis check + queue depths via BullMQ
  try {
    const { redis } = await import("@/lib/redis");
    await redis.ping();
    checks.redis = "ok";

    // Check BullMQ queue depths
    const queueNames = ["script", "audio", "kling", "render", "publish"];
    await Promise.all(
      queueNames.map(async (name) => {
        try {
          const waiting = await redis.llen(`bull:${name}:wait`);
          const active = await redis.llen(`bull:${name}:active`);
          queues[name] = waiting + active;
        } catch {
          queues[name] = -1;
        }
      })
    );
  } catch {
    checks.redis = "error";
    errors.push("Redis: connection failed");
  }

  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks, queues, errors, ts: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
