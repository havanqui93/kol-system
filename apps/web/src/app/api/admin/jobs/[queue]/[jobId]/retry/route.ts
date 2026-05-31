import { NextResponse } from "next/server";
import { getQueue } from "@kol/queue";

const VALID_QUEUES = ["script", "audio", "kling", "render", "publish"] as const;
type ValidQueue = (typeof VALID_QUEUES)[number];

// POST /api/admin/jobs/:queue/:jobId/retry — retry a specific failed BullMQ job
export async function POST(
  _request: Request,
  { params }: { params: { queue: string; jobId: string } }
) {
  if (!VALID_QUEUES.includes(params.queue as ValidQueue)) {
    return NextResponse.json({ error: "Invalid queue name" }, { status: 400 });
  }

  const queue = getQueue(params.queue as ValidQueue);
  const job = await queue.getJob(params.jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const state = await job.getState();
  if (state !== "failed") {
    return NextResponse.json({ error: `Job is in state '${state}', not failed` }, { status: 400 });
  }

  await job.retry();
  return NextResponse.json({ ok: true, jobId: params.jobId, queue: params.queue });
}
