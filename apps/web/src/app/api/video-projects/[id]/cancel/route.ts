import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { queues } from "@/lib/queues";

// POST /api/video-projects/:id/cancel — attempt to cancel in-progress pipeline jobs
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const { id: projectId } = params;

  const project = await prisma.videoProject.findFirst({ where: { id: projectId, userId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const cancelableStatuses = [
    "script_generating",
    "audio_generating",
    "video_generating",
    "rendering",
    "publishing",
  ];

  if (!cancelableStatuses.includes(project.status)) {
    return NextResponse.json(
      { error: "Project is not in a cancelable state" },
      { status: 409 }
    );
  }

  // Remove waiting jobs for this project from all queues
  const queueList = Object.values(queues);
  let cancelledCount = 0;

  await Promise.all(
    queueList.map(async (queue) => {
      const waiting = await queue.getWaiting();
      const delayed = await queue.getDelayed();
      const toCancel = [...waiting, ...delayed].filter(
        (job) => (job.data as any)?.projectId === projectId
      );

      await Promise.all(
        toCancel.map(async (job) => {
          await job.remove();
          cancelledCount++;
        })
      );
    })
  );

  // Mark project as failed/cancelled
  await prisma.videoProject.update({
    where: { id: projectId },
    data: { status: "failed", errorMessage: "Đã hủy bởi người dùng" },
  });

  return NextResponse.json({ cancelled: true, jobsRemoved: cancelledCount });
}
