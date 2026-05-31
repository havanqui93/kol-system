import { NextResponse } from "next/server";
import { cacheOrFetch, CacheKeys } from "@/lib/cache";

export async function GET() {
  const info = await cacheOrFetch(CacheKeys.systemInfo(), 300, async () => ({
    version: process.env.npm_package_version ?? "1.0.0",
    nodeVersion: process.version,
    env: process.env.NODE_ENV ?? "development",
    uptime: Math.round(process.uptime()),
    memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? null,
    commitSha: process.env.NEXT_PUBLIC_COMMIT_SHA ?? null,
  }));

  return NextResponse.json(info);
}
