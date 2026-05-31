import { NextResponse } from "next/server";
import { getQueue } from "@kol/queue";

const QUEUE_NAMES = ["script", "audio", "kling", "render", "publish"] as const;

// GET /api/admin/failed-jobs — lists failed BullMQ jobs across all queues
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

  const results = await Promise.all(
    QUEUE_NAMES.map(async (name) => {
      const queue = getQueue(name);
      const failed = await queue.getFailed(0, limit - 1);
      return failed.map((job) => ({
        queue: name,
        jobId: job.id,
        name: job.name,
        data: job.data,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        finishedOn: job.finishedOn,
      }));
    })
  );

  const allFailed = results
    .flat()
    .sort((a, b) => (b.finishedOn ?? 0) - (a.finishedOn ?? 0))
    .slice(0, limit);

  return NextResponse.json({
    total: allFailed.length,
    jobs: allFailed,
  });
}

// DELETE /api/admin/failed-jobs — clean all failed jobs from all queues
export async function DELETE() {
  const cleaned = await Promise.all(
    QUEUE_NAMES.map(async (name) => {
      const queue = getQueue(name);
      const count = await queue.clean(0, 1000, "failed");
      return { queue: name, cleaned: count.length };
    })
  );

  return NextResponse.json({ cleaned });
}
