import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import { prisma } from "@kol/database";
import { AnthropicLLMProvider, KlingVideoProvider, R2StorageProvider } from "@kol/providers";
import { KlingAgent, type VisualScene, type SceneMotionBrush } from "@kol/agents";
import type { GenerateKlingVideoJobPayload } from "@kol/queue";
import { QUEUE_NAMES } from "@kol/queue";

export function createGenerateKlingWorker(connection: Redis) {
  return new Worker<GenerateKlingVideoJobPayload>(
    QUEUE_NAMES.GENERATE_KLING_VIDEO,
    async (job) => {
      const { projectId, sceneId, sceneIndex, klingPrompt, negativePrompt, sourceImageUrl, durationSeconds } = job.data;

      const scene = await prisma.videoScene.findUnique({ where: { id: sceneId } });
      if (!scene) throw new Error(`Scene ${sceneId} not found`);

      const project = await prisma.videoProject.findUnique({
        where: { id: projectId },
        include: { product: true, kolProfile: true },
      });
      if (!project) throw new Error(`Project ${projectId} not found`);

      const llm = new AnthropicLLMProvider();
      const video = new KlingVideoProvider();
      const storage = new R2StorageProvider();
      const klingAgent = new KlingAgent(video, llm, storage);

      // Update scene status
      await prisma.videoScene.update({ where: { id: sceneId }, data: { status: "processing" } });

      await job.updateProgress(10);

      // Motion control data is stored as JSON on the scene; when present it
      // directs Kling's image-to-video instead of using random motion.
      const motionBrushes = (scene.motionBrushes as SceneMotionBrush[] | null) ?? undefined;

      const visualScene: VisualScene = {
        sceneIndex,
        label: `Scene ${sceneIndex}`,
        durationSeconds: scene.durationSeconds,
        visualType: scene.visualType as VisualScene["visualType"],
        tool: "kling",
        klingPrompt: scene.klingPrompt ?? klingPrompt,
        negativePrompt: scene.negativePrompt ?? negativePrompt ?? undefined,
        motionBrushes: motionBrushes && motionBrushes.length > 0 ? motionBrushes : undefined,
        staticMaskUrl: scene.staticMaskUrl ?? undefined,
        audioSegment: scene.audioSegment ?? "",
      };

      let clipResult;
      if (scene.visualType === "talking_head" && project.kolProfile?.avatarImageUrl) {
        clipResult = await klingAgent.generateKolClip(
          visualScene,
          project.kolProfile.avatarImageUrl,
          project.kolProfile.name,
          "energetic"
        );
      } else if (sourceImageUrl || project.product?.imageUrls[0]) {
        const imageUrl = sourceImageUrl ?? project.product!.imageUrls[0]!;
        clipResult = await klingAgent.generateProductClip(
          visualScene,
          imageUrl,
          {
            name: project.product?.name ?? "product",
            category: project.product?.category ?? "general",
            sellingPoint: project.product?.description?.slice(0, 100) ?? "",
          }
        );
      } else {
        // Text-to-video fallback
        const vtJob = await video.textToVideo({
          prompt: klingPrompt,
          negativePrompt: negativePrompt ?? undefined,
          durationSeconds: Math.min(durationSeconds, 5) as 5,
          aspectRatio: "9:16",
        });
        clipResult = { sceneIndex, jobId: vtJob.jobId, status: vtJob.status, clipUrl: vtJob.videoUrl, costUsd: vtJob.cost.costUsd };
      }

      await job.updateProgress(40);

      // Poll until done (up to 5 minutes)
      const finalResult = await klingAgent.pollUntilDone(clipResult.jobId);

      if (finalResult.status === "failed" || !finalResult.clipUrl) {
        await prisma.videoScene.update({ where: { id: sceneId }, data: { status: "failed" } });
        throw new Error(`Kling clip generation failed for scene ${sceneIndex}`);
      }

      let finalClipUrl = finalResult.clipUrl;
      let faceSwapCostUsd = 0;

      // Face swap: give talking-head clips the KOL's consistent reference face.
      if (scene.visualType === "talking_head" && project.kolProfile?.referenceFaceUrl) {
        const swapJob = await klingAgent.swapFace(
          sceneIndex,
          finalClipUrl,
          project.kolProfile.referenceFaceUrl
        );
        if (swapJob) {
          await job.updateProgress(70);
          const swapped = await klingAgent.pollUntilDone(swapJob.jobId);
          if (swapped.status === "completed" && swapped.clipUrl) {
            finalClipUrl = swapped.clipUrl;
            faceSwapCostUsd = swapJob.costUsd;
          }
          // On swap failure we keep the original clip rather than failing the scene.
        }
      }

      // Mirror clip to our R2 storage
      const clipKey = `projects/${projectId}/clips/scene-${sceneIndex}.mp4`;
      const storedUrl = await storage.uploadFromUrl(clipKey, finalClipUrl);

      const totalClipCost = finalResult.costUsd + faceSwapCostUsd;

      await prisma.$transaction([
        prisma.videoScene.update({
          where: { id: sceneId },
          data: { clipUrl: storedUrl, status: "completed" },
        }),
        prisma.generatedAsset.create({
          data: { projectId, assetType: "video_clip", url: storedUrl, mimeType: "video/mp4" },
        }),
        prisma.costTracking.update({
          where: { projectId },
          data: {
            videoCostUsd: { increment: totalClipCost },
            totalCostUsd: { increment: totalClipCost },
          },
        }),
      ]);

      // Check if all scenes are done
      const pendingScenes = await prisma.videoScene.count({
        where: { projectId, status: { not: "completed" } },
      });

      if (pendingScenes === 0) {
        await prisma.videoProject.update({ where: { id: projectId }, data: { status: "clips_ready" } });
      }

      await job.updateProgress(100);
      return { clipUrl: storedUrl, costUsd: totalClipCost };
    },
    {
      connection,
      concurrency: Number(process.env.WORKER_CONCURRENCY_KLING ?? "2"), // Kling is slow
      limiter: { max: 5, duration: 60000 },
    }
  );
}
