import { NextResponse } from "next/server";
import { prisma, type VideoScript } from "@kol/database";
import { AnthropicLLMProvider } from "@kol/providers";
import { VisualPlanAgent, type VisualScene } from "@kol/agents";
import type { ScriptOutput } from "@kol/agents";
import { queues } from "@/lib/queues";
import { getRequestUserId } from "@/lib/user";

function buildScriptOutput(script: VideoScript, durationSeconds: number): ScriptOutput {
  const parts = [
    { label: "Hook", text: script.hook, durationSeconds: 4 },
    { label: "Problem", text: script.problem ?? "", durationSeconds: 6 },
    { label: "Introduction", text: script.introduction ?? "", durationSeconds: 8 },
    { label: "Benefits", text: script.benefits ?? "", durationSeconds: 8 },
    { label: "Proof", text: script.proof ?? "", durationSeconds: 5 },
    { label: "Offer", text: script.offer ?? "", durationSeconds: 4 },
    { label: "CTA", text: script.cta, durationSeconds: 5 },
  ].filter((scene) => scene.text.trim().length > 0);

  const total = parts.reduce((sum, scene) => sum + scene.durationSeconds, 0) || durationSeconds;
  const scale = durationSeconds / total;

  return {
    hook: script.hook,
    problem: script.problem ?? "",
    introduction: script.introduction ?? "",
    benefits: script.benefits ?? "",
    proof: script.proof ?? "",
    offer: script.offer ?? "",
    cta: script.cta,
    fullScript: script.fullScript,
    wordCount: script.wordCount ?? script.fullScript.split(/\s+/).filter(Boolean).length,
    estimatedDurationSeconds: script.estimatedDurationSeconds ?? durationSeconds,
    scenes: parts.map((scene) => ({
      label: scene.label,
      text: scene.text,
      durationSeconds: Math.max(3, Math.round(scene.durationSeconds * scale)),
    })),
  };
}

function ensureKlingScenes(scenes: VisualScene[], hasKolAvatar: boolean, hasProductImage: boolean): VisualScene[] {
  const klingScenes = scenes.filter((scene) => scene.tool === "kling");
  if (klingScenes.length > 0) return scenes;

  const first = scenes[0];
  if (!first) return scenes;

  return [
    {
      ...first,
      tool: "kling",
      visualType: hasKolAvatar ? "talking_head" : hasProductImage ? "product_motion" : "product_broll",
      durationSeconds: Math.min(5, Math.max(3, Math.round(first.durationSeconds))),
      klingPrompt:
        first.klingPrompt ??
        "Vertical 9:16 social commerce video, energetic Vietnamese KOL style, polished lighting, natural movement, high quality",
    },
    ...scenes.slice(1),
  ];
}

const QUALITY_LIMITS = {
  cheap: { maxKlingScenes: 1, maxKlingSeconds: 5 },
  balanced: { maxKlingScenes: 2, maxKlingSeconds: 10 },
  premium: { maxKlingScenes: 3, maxKlingSeconds: 15 },
} as const;

type QualityPreset = keyof typeof QUALITY_LIMITS;

function applyQualityPreset(scenes: VisualScene[], preset: string): VisualScene[] {
  const limits = QUALITY_LIMITS[(preset as QualityPreset) in QUALITY_LIMITS ? (preset as QualityPreset) : "balanced"];
  let klingScenes = 0;
  let klingSeconds = 0;

  return scenes.map((scene) => {
    if (scene.tool !== "kling") return scene;

    const nextDuration = Math.min(5, Math.max(3, Math.round(scene.durationSeconds)));
    const canUseKling = klingScenes < limits.maxKlingScenes && klingSeconds + nextDuration <= limits.maxKlingSeconds;

    if (!canUseKling) {
      return {
        ...scene,
        tool: scene.visualType === "talking_head" ? "ffmpeg_still" : scene.tool === "kling" ? "ffmpeg_still" : scene.tool,
        durationSeconds: Math.max(3, Math.round(scene.durationSeconds)),
      };
    }

    klingScenes += 1;
    klingSeconds += nextDuration;
    return { ...scene, durationSeconds: nextDuration };
  });
}

// POST /api/video-projects/:id/generate-kling-clips
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  const { id: projectId } = params;

  const [project, approvedScript] = await Promise.all([
    prisma.videoProject.findFirst({
      where: { id: projectId, userId },
      include: { product: true, kolProfile: true },
    }),
    prisma.videoScript.findFirst({ where: { projectId, isApproved: true } }),
  ]);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!approvedScript) return NextResponse.json({ error: "No approved script found. Approve a script first." }, { status: 400 });
  if (project.status !== "audio_ready" && project.status !== "clips_ready") {
    return NextResponse.json({ error: "Project is not ready for Kling clips. Generate audio first." }, { status: 400 });
  }

  await prisma.videoScene.deleteMany({ where: { projectId } });
  await prisma.generatedAsset.deleteMany({ where: { projectId, assetType: "video_clip" } });

  const llm = new AnthropicLLMProvider();
  const visualPlanAgent = new VisualPlanAgent(llm);
  const scriptOutput = buildScriptOutput(approvedScript, project.durationSeconds);
  const { output, costUsd } = await visualPlanAgent.run(scriptOutput, {
    productName: project.product?.name ?? project.title ?? "product",
    platform: project.platform,
    videoType: project.videoType,
    hasKolAvatar: Boolean(project.kolProfile?.avatarImageUrl),
    hasProductImage: Boolean(project.product?.imageUrls.length),
  });

  const plannedScenes = applyQualityPreset(
    ensureKlingScenes(
      output.scenes,
      Boolean(project.kolProfile?.avatarImageUrl),
      Boolean(project.product?.imageUrls.length)
    ),
    project.qualityPreset
  );

  if (plannedScenes.length === 0) {
    return NextResponse.json({ error: "Visual plan did not produce any scenes" }, { status: 500 });
  }

  await prisma.videoProject.update({ where: { id: projectId }, data: { status: "video_generating", errorMessage: null } });

  const createdScenes = await prisma.$transaction(
    plannedScenes.map((scene, index) =>
      prisma.videoScene.create({
        data: {
          projectId,
          sceneIndex: index + 1,
          visualType: scene.visualType,
          durationSeconds: Math.min(10, Math.max(3, scene.durationSeconds)),
          klingPrompt: scene.klingPrompt ?? null,
          negativePrompt: scene.negativePrompt ?? null,
          audioSegment: scene.audioSegment,
          startTimeMs: null,
          endTimeMs: null,
          status: scene.tool === "kling" ? "pending" : "completed",
        },
      })
    )
  );

  await prisma.costTracking.upsert({
    where: { projectId },
    create: {
      userId,
      projectId,
      llmCostUsd: costUsd,
      totalCostUsd: costUsd,
    },
    update: {
      llmCostUsd: { increment: costUsd },
      totalCostUsd: { increment: costUsd },
    },
  });

  const klingSceneJobs = await Promise.all(
    createdScenes
      .filter((scene) => scene.status === "pending")
      .map((scene) =>
        queues.generateKlingVideo.add("generate-kling-video", {
          projectId,
          userId,
          sceneId: scene.id,
          sceneIndex: scene.sceneIndex,
          visualType: scene.visualType,
          klingPrompt: scene.klingPrompt ?? "Vertical 9:16 high quality social commerce video",
          negativePrompt: scene.negativePrompt ?? undefined,
          durationSeconds: Math.min(10, Math.max(3, Math.round(scene.durationSeconds))),
        })
      )
  );

  if (klingSceneJobs.length === 0) {
    await prisma.videoProject.update({ where: { id: projectId }, data: { status: "clips_ready" } });
  }

  return NextResponse.json(
    {
      status: klingSceneJobs.length > 0 ? "queued" : "completed",
      sceneCount: createdScenes.length,
      klingJobCount: klingSceneJobs.length,
      jobIds: klingSceneJobs.map((job) => job.id),
    },
    { status: 202 }
  );
}
