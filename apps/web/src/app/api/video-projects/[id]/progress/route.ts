import { NextResponse } from "next/server";
import { queues } from "@/lib/queues";
import { QUEUE_NAMES } from "@kol/queue";

export const dynamic = "force-dynamic";

// GET /api/video-projects/:id/progress — active BullMQ job progress for this project
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { id: projectId } = params;

  const queueList = [
    { name: "generateScript", queue: queues.generateScript, queueName: QUEUE_NAMES.GENERATE_SCRIPT },
    { name: "generateAudio", queue: queues.generateAudio, queueName: QUEUE_NAMES.GENERATE_AUDIO },
    { name: "generateKlingVideo", queue: queues.generateKlingVideo, queueName: QUEUE_NAMES.GENERATE_KLING_VIDEO },
    { name: "renderVideo", queue: queues.renderVideo, queueName: QUEUE_NAMES.RENDER_VIDEO },
    { name: "publishVideo", queue: queues.publishVideo, queueName: QUEUE_NAMES.PUBLISH_VIDEO },
  ];

  const activeJobs = await Promise.all(
    queueList.map(async ({ name, queue }) => {
      const active = await queue.getActive();
      return active
        .filter((job) => (job.data as any)?.projectId === projectId)
        .map((job) => ({
          worker: name,
          jobId: job.id,
          progress: job.progress,
          startedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
          attemptsMade: job.attemptsMade,
        }));
    })
  );

  const jobs = activeJobs.flat();

  return NextResponse.json({ projectId, activeJobs: jobs, count: jobs.length });
}
