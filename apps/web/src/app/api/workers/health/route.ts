import { NextResponse } from "next/server";
import { queues } from "@/lib/queues";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

// GET /api/workers/health — check Redis connectivity and queue health
export async function GET() {
  try {
    await redis.ping();

    const queueStats = await Promise.all(
      Object.entries(queues).map(async ([name, queue]) => {
        const [waiting, active, failed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getFailedCount(),
        ]);
        return { name, waiting, active, failed, healthy: true };
      })
    );

    return NextResponse.json({
      status: "healthy",
      redis: "connected",
      queues: queueStats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "unhealthy",
        redis: "disconnected",
        error: err instanceof Error ? err.message : "unknown",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
