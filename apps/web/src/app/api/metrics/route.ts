import { NextResponse } from "next/server";
import { queues } from "@/lib/queues";

export const dynamic = "force-dynamic";

// GET /api/metrics — queue depth and job counts for observability
export async function GET() {
  try {
    const queueEntries = Object.entries(queues) as [string, (typeof queues)[keyof typeof queues]][];

    const stats = await Promise.all(
      queueEntries.map(async ([name, queue]) => {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
        ]);

        return {
          name,
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + delayed,
        };
      })
    );

    const summary = {
      totalWaiting: stats.reduce((s, q) => s + q.waiting, 0),
      totalActive: stats.reduce((s, q) => s + q.active, 0),
      totalFailed: stats.reduce((s, q) => s + q.failed, 0),
    };

    return NextResponse.json({
      queues: stats,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch metrics", detail: error instanceof Error ? error.message : "unknown" },
      { status: 503 }
    );
  }
}
