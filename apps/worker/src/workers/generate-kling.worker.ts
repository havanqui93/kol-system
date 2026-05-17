import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import { prisma } from "@kol/database";
import { AnthropicLLMProvider, KlingVideoProvider, R2StorageProvider } from "@kol/providers";
import { KlingAgent } from "@kol/agents";
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

      let clipResult;
      if (scene.visualType === "talking_head" && project.kolProfile?.avatarImageUrl) {
        clipResult = await klingAgent.generateKolClip(
          { ...scene, sceneIndex, klingPrompt: scene.klingPrompt ?? klingPrompt, audioSegment: scene.audioSegment ?? "" },
          project.kolProfile.avatarImageUrl,
          project.kolProfile.name,
          "energetic"
        );
      } else if (sourceImageUrl || project.product?.imageUrls[0]) {
        const imageUrl = sourceImageUrl ?? project.product!.imageUrls[0]!;
        clipResult = await klingAgent.generateProductClip(
          { ...scene, sceneIndex, klingPrompt: scene.klingPrompt ?? klingPrompt, audioSegment: scene.audioSegment ?? "" },
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

      // Mirror clip to our R2 storage
      const clipKey = `projects/${projectId}/clips/scene-${sceneIndex}.mp4`;
      const storedUrl = await storage.uploadFromUrl(clipKey, finalResult.clipUrl);

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
            videoCostUsd: { increment: finalResult.costUsd },
            totalCostUsd: { increment: finalResult.costUsd },
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
      return { clipUrl: storedUrl, costUsd: finalResult.costUsd };
    },
    {
      connection,
      concurrency: 2, // Kling is slow, keep concurrency low
      limiter: { max: 5, duration: 60000 },
    }
  );
}
