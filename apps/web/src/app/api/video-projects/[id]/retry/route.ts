import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { queues } from "@/lib/queues";
import { getRequestUserId } from "@/lib/user";

// POST /api/video-projects/:id/retry
// Resets a failed project to the last recoverable state and re-queues the appropriate job.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  const { id: projectId } = params;

  const project = await prisma.videoProject.findFirst({ where: { id: projectId, userId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.status !== "failed") {
    return NextResponse.json({ error: "Only failed projects can be retried" }, { status: 400 });
  }

  const [approvedScript, assets] = await Promise.all([
    prisma.videoScript.findFirst({ where: { projectId, isApproved: true } }),
    prisma.generatedAsset.findMany({ where: { projectId } }),
  ]);

  const hasAudio = assets.some((a) => a.assetType === "audio");
  const hasClips = assets.some((a) => a.assetType === "video_clip");
  const costTracking = await prisma.costTracking.findUnique({ where: { projectId } });

  let resetStatus: string;
  let jobId: string | undefined;

  if (hasClips) {
    // Clips are done — retry the render
    resetStatus = "clips_ready";
    const renderJob = await prisma.renderJob.create({
      data: { projectId, status: "pending" },
    });
    const audioAsset = assets.find((a) => a.assetType === "audio");
    const subtitleAsset = assets.find((a) => a.assetType === "subtitle");
    const job = await queues.renderVideo.add("render-video", {
      projectId,
      userId,
      renderJobId: renderJob.id,
      audioUrl: audioAsset?.url ?? "",
      subtitleUrl: subtitleAsset?.url ?? undefined,
    });
    jobId = job.id ?? undefined;
    resetStatus = "rendering";
  } else if (hasAudio && approvedScript) {
    // Audio done — retry Kling generation
    resetStatus = "audio_ready";
  } else if (approvedScript) {
    // Script approved — retry audio
    resetStatus = "script_approved";
  } else {
    // Nothing usable — restart from scratch
    resetStatus = "draft";
  }

  await prisma.videoProject.update({
    where: { id: projectId },
    data: { status: resetStatus as any, errorMessage: null },
  });

  return NextResponse.json({ status: resetStatus, jobId });
}
