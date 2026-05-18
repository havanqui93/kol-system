import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { queues } from "@/lib/queues";

const RenderSchema = z.object({
  backgroundMusicUrl: z.string().url().optional(),
});

// POST /api/video-projects/:id/render
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const { id: projectId } = params;
  const body = await request.json().catch(() => ({}));
  const options = RenderSchema.parse(body);

  const project = await prisma.videoProject.findFirst({ where: { id: projectId, userId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (project.status !== "clips_ready") {
    return NextResponse.json({ error: "Project not ready to render. Generate Kling clips first." }, { status: 400 });
  }

  const [audioAsset, subtitleAsset, videoClipCount] = await Promise.all([
    prisma.generatedAsset.findFirst({ where: { projectId, assetType: "audio" }, orderBy: { createdAt: "desc" } }),
    prisma.generatedAsset.findFirst({ where: { projectId, assetType: "subtitle" }, orderBy: { createdAt: "desc" } }),
    prisma.generatedAsset.count({ where: { projectId, assetType: "video_clip" } }),
  ]);

  if (!audioAsset) return NextResponse.json({ error: "No audio asset found" }, { status: 400 });
  if (videoClipCount === 0) return NextResponse.json({ error: "No Kling video clips found" }, { status: 400 });

  const renderJob = await prisma.renderJob.create({
    data: { projectId, status: "pending" },
  });

  await prisma.videoProject.update({ where: { id: projectId }, data: { status: "rendering" } });

  const job = await queues.renderVideo.add("render-video", {
    projectId,
    userId,
    renderJobId: renderJob.id,
    audioUrl: audioAsset.url,
    subtitleUrl: subtitleAsset?.url ?? undefined,
    backgroundMusicUrl: options.backgroundMusicUrl,
    outputWidth: 1080,
    outputHeight: 1920,
  });

  return NextResponse.json({ jobId: job.id, renderJobId: renderJob.id, status: "queued" }, { status: 202 });
}
