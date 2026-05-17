import type { VideoProvider, LLMProvider, StorageProvider } from "@kol/providers";
import { buildKlingProductPromptMessages, buildKlingKolPromptMessages, type KlingProductPromptOutput } from "../prompts/kling-prompts.js";
import type { VisualScene } from "../prompts/visual-plan.js";

export interface KlingClipResult {
  sceneIndex: number;
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  clipUrl?: string;
  costUsd: number;
}

export class KlingAgent {
  constructor(
    private video: VideoProvider,
    private llm: LLMProvider,
    private storage: StorageProvider
  ) {}

  async generateProductClip(
    scene: VisualScene,
    productImageUrl: string,
    productContext: { name: string; category: string; sellingPoint: string }
  ): Promise<KlingClipResult> {
    // Generate optimized Kling prompt via LLM
    const promptMessages = buildKlingProductPromptMessages({
      productName: productContext.name,
      productCategory: productContext.category,
      sellingPoint: productContext.sellingPoint,
      mood: "energetic",
      platform: "tiktok",
    });

    const { data: promptData } = await this.llm.generateJSON<KlingProductPromptOutput>(promptMessages, {
      model: "claude-haiku-4-5-20251001",
    });

    const job = await this.video.imageToVideo({
      imageUrl: productImageUrl,
      prompt: scene.klingPrompt ?? promptData.prompt,
      negativePrompt: promptData.negativePrompt,
      durationSeconds: Math.min(scene.durationSeconds, 10) as 5 | 10,
      aspectRatio: "9:16",
      cameraMovement: scene.cameraMovement as any,
    });

    return {
      sceneIndex: scene.sceneIndex,
      jobId: job.jobId,
      status: job.status,
      clipUrl: job.videoUrl,
      costUsd: job.cost.costUsd,
    };
  }

  async generateKolClip(
    scene: VisualScene,
    kolAvatarUrl: string,
    kolDescription: string,
    mood: string
  ): Promise<KlingClipResult> {
    const promptMessages = buildKlingKolPromptMessages({
      kolDescription,
      mood,
      scriptExcerpt: scene.audioSegment,
      platform: "tiktok",
    });

    const { data: promptData } = await this.llm.generateJSON<any>(promptMessages, {
      model: "claude-haiku-4-5-20251001",
    });

    const job = await this.video.imageToVideo({
      imageUrl: kolAvatarUrl,
      prompt: scene.klingPrompt ?? promptData.prompt,
      negativePrompt: promptData.negativePrompt,
      durationSeconds: 5,
      aspectRatio: "9:16",
    });

    return {
      sceneIndex: scene.sceneIndex,
      jobId: job.jobId,
      status: job.status,
      clipUrl: job.videoUrl,
      costUsd: job.cost.costUsd,
    };
  }

  async pollUntilDone(jobId: string, timeoutMs = 300_000): Promise<KlingClipResult> {
    const start = Date.now();
    const pollInterval = 10_000; // 10s

    while (Date.now() - start < timeoutMs) {
      const status = await this.video.getJobStatus(jobId);
      if (status.status === "completed" || status.status === "failed") {
        return {
          sceneIndex: -1,
          jobId,
          status: status.status,
          clipUrl: status.videoUrl,
          costUsd: status.cost.costUsd,
        };
      }
      await new Promise((r) => setTimeout(r, pollInterval));
    }

    throw new Error(`Kling job ${jobId} timed out after ${timeoutMs}ms`);
  }
}
