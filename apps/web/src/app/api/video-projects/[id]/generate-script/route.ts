import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { queues } from "@/lib/queues";

// POST /api/video-projects/:id/generate-script
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const { id: projectId } = params;

  const project = await prisma.videoProject.findFirst({ where: { id: projectId, userId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (["script_generating", "audio_generating", "video_generating", "rendering"].includes(project.status)) {
    return NextResponse.json({ error: "Project is already being processed" }, { status: 409 });
  }

  const costTracking = await prisma.costTracking.findUnique({ where: { projectId } });

  // On regeneration unapprove existing scripts so user must review the new version
  await prisma.videoScript.updateMany({ where: { projectId }, data: { isApproved: false } });

  await prisma.videoProject.update({
    where: { id: projectId },
    data: { status: "script_generating", errorMessage: null },
  });

  const job = await queues.generateScript.add("generate-script", {
    projectId,
    userId,
    budgetLimitUsd: costTracking?.budgetLimitUsd ? Number(costTracking.budgetLimitUsd) : undefined,
  });

  return NextResponse.json({ jobId: job.id, status: "queued" }, { status: 202 });
}
