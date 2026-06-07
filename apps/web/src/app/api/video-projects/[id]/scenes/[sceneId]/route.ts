import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { queues } from "@/lib/queues";
import { getRequestUserId } from "@/lib/user";

const MotionPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const MotionBrushSchema = z.object({
  // Hosted PNG mask (white = the region that should move)
  maskUrl: z.string().url(),
  // Ordered, normalized path the brushed region follows across the clip
  trajectory: z.array(MotionPointSchema).min(1).max(50),
});

const PatchSceneSchema = z.object({
  motionBrushes: z.array(MotionBrushSchema).max(6).optional(),
  // Empty string clears the static mask
  staticMaskUrl: z.union([z.string().url(), z.literal("")]).optional(),
  // Re-run the Kling clip for this scene with the new motion data (default true)
  regenerate: z.boolean().optional().default(true),
});

// PATCH /api/video-projects/:id/scenes/:sceneId
// Attach motion-control data (brushes/static mask) to a scene and, by default,
// re-queue its Kling clip so the directed motion takes effect.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; sceneId: string } }
) {
  const userId = getRequestUserId(request);
  const body = await request.json();
  const { motionBrushes, staticMaskUrl, regenerate } = PatchSceneSchema.parse(body);

  const project = await prisma.videoProject.findFirst({
    where: { id: params.id, userId },
    include: { product: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const scene = await prisma.videoScene.findFirst({
    where: { id: params.sceneId, projectId: params.id },
  });
  if (!scene) return NextResponse.json({ error: "Scene not found" }, { status: 404 });

  const updated = await prisma.videoScene.update({
    where: { id: scene.id },
    data: {
      ...(motionBrushes !== undefined ? { motionBrushes } : {}),
      ...(staticMaskUrl !== undefined ? { staticMaskUrl: staticMaskUrl === "" ? null : staticMaskUrl } : {}),
      ...(regenerate ? { status: "pending", clipUrl: null } : {}),
    },
  });

  let jobId: string | undefined;
  if (regenerate) {
    // Bring the project back into the generating state so the new clip is awaited.
    if (project.status === "clips_ready" || project.status === "rendered" || project.status === "rendering") {
      await prisma.videoProject.update({ where: { id: project.id }, data: { status: "video_generating" } });
    }

    const job = await queues.generateKlingVideo.add("generate-kling-video", {
      projectId: project.id,
      userId,
      sceneId: updated.id,
      sceneIndex: updated.sceneIndex,
      visualType: updated.visualType,
      klingPrompt: updated.klingPrompt ?? "Vertical 9:16 high quality social commerce video",
      negativePrompt: updated.negativePrompt ?? undefined,
      sourceImageUrl: project.product?.imageUrls[0],
      durationSeconds: Math.min(10, Math.max(3, Math.round(updated.durationSeconds))),
    });
    jobId = job.id;
  }

  return NextResponse.json({
    scene: {
      id: updated.id,
      sceneIndex: updated.sceneIndex,
      status: updated.status,
      motionBrushes: updated.motionBrushes,
      staticMaskUrl: updated.staticMaskUrl,
    },
    regenerated: regenerate,
    jobId,
  });
}
