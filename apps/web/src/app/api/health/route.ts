import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    database: "error",
    redis: "error",
  };

  await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`.then(() => { checks.database = "ok"; }),
    redis.ping().then(() => { checks.redis = "ok"; }),
  ]);

  const healthy = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    },
    { status: healthy ? 200 : 503 }
  );
}
