import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

export const dynamic = "force-dynamic";

// GET /api/health — checks DB + Redis connectivity
export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};
  const errors: string[] = [];

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (err) {
    checks.database = "error";
    errors.push(`DB: ${String(err)}`);
  }

  // Redis check
  try {
    const { redis } = await import("@/lib/redis");
    await redis.ping();
    checks.redis = "ok";
  } catch {
    checks.redis = "error";
    errors.push("Redis: connection failed");
  }

  const healthy = Object.values(checks).every((v) => v === "ok");
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks, errors, ts: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
