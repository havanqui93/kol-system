import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { getQueue } from "@kol/queue";

// POST /api/video-projects/:id/publish/:jobId/retry
export async function POST(
  request: Request,
  { params }: { params: { id: string; jobId: string } }
) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";

  const [project, publishJob] = await Promise.all([
    prisma.videoProject.findFirst({ where: { id: params.id, userId } }),
    prisma.publishJob.findFirst({ where: { id: params.jobId, projectId: params.id } }),
  ]);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!publishJob) return NextResponse.json({ error: "Publish job not found" }, { status: 404 });
  if (publishJob.status !== "failed") {
    return NextResponse.json({ error: "Only failed publish jobs can be retried" }, { status: 400 });
  }

  await prisma.publishJob.update({
    where: { id: params.jobId },
    data: { status: "scheduled", errorMessage: null, updatedAt: new Date() },
  });

  const queue = getQueue("publish");
  await queue.add(
    "publish-video",
    {
      projectId: params.id,
      userId,
      publishJobId: params.jobId,
      platform: publishJob.platform,
      scheduledAt: publishJob.scheduledAt?.toISOString(),
    },
    { attempts: 3, backoff: { type: "exponential", delay: 5000 } }
  );

  return NextResponse.json({ ok: true, publishJobId: params.jobId });
}
