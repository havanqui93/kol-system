import type {
  VideoProvider,
  ImageToVideoOptions,
  TextToVideoOptions,
  MotionControlOptions,
  FaceSwapOptions,
  VideoJobResult,
} from "../types.js";
import { withRetry } from "../retry.js";

// Kling via fal.ai — cost: ~$0.14/5s clip at standard quality
const COST_PER_5S = 0.14;
// Face swap is a lightweight post-process pass, billed per clip.
const FACE_SWAP_COST = 0.04;

export class KlingVideoProvider implements VideoProvider {
  private apiKey: string;
  private baseUrl = "https://fal.run";

  constructor(apiKey?: string) {
    // Support both FAL_KEY and FAL_API_KEY env var names
    this.apiKey = apiKey ?? process.env.FAL_KEY ?? process.env.FAL_API_KEY ?? "";
  }

  async imageToVideo(options: ImageToVideoOptions): Promise<VideoJobResult> {
    const body = {
      image_url: options.imageUrl,
      prompt: options.prompt,
      negative_prompt: options.negativePrompt ?? "blurry, low quality, watermark, text overlay",
      duration: options.durationSeconds ?? 5,
      aspect_ratio: options.aspectRatio ?? "9:16",
      camera_movement: options.cameraMovement ?? "static",
    };

    return withRetry(
      () => this.submitJob("fal-ai/kling-video/v1.6/standard/image-to-video", body),
      { maxAttempts: 2, initialDelayMs: 5000 }
    );
  }

  // Image-to-video with motion control. The brushed regions follow explicit
  // trajectories (Kling dynamic_masks); static_mask regions are held still.
  async imageToVideoWithMotion(options: MotionControlOptions): Promise<VideoJobResult> {
    const body = {
      image_url: options.imageUrl,
      prompt: options.prompt,
      negative_prompt: options.negativePrompt ?? "blurry, low quality, watermark, text overlay",
      duration: options.durationSeconds ?? 5,
      aspect_ratio: options.aspectRatio ?? "9:16",
      camera_movement: options.cameraMovement ?? "static",
      dynamic_masks: options.motionBrushes.map((brush) => ({
        mask: brush.maskUrl,
        trajectories: brush.trajectory.map((p) => ({ x: p.x, y: p.y })),
      })),
      ...(options.staticMaskUrl ? { static_mask: options.staticMaskUrl } : {}),
    };

    return withRetry(
      () => this.submitJob("fal-ai/kling-video/v1.6/standard/image-to-video", body),
      { maxAttempts: 2, initialDelayMs: 5000 }
    );
  }

  // Swap the face in an existing video with a reference face — used to give a
  // KOL profile one consistent identity across every generated clip.
  async faceSwap(options: FaceSwapOptions): Promise<VideoJobResult> {
    const body = {
      video_url: options.targetVideoUrl,
      swap_image_url: options.faceImageUrl,
    };

    const result = await withRetry(
      () => this.submitJob("fal-ai/video-face-swap", body),
      { maxAttempts: 2, initialDelayMs: 5000 }
    );
    return { ...result, cost: { costUsd: FACE_SWAP_COST } };
  }

  async textToVideo(options: TextToVideoOptions): Promise<VideoJobResult> {
    const body = {
      prompt: options.prompt,
      negative_prompt: options.negativePrompt ?? "blurry, low quality, watermark",
      duration: options.durationSeconds ?? 5,
      aspect_ratio: options.aspectRatio ?? "9:16",
    };

    return withRetry(
      () => this.submitJob("fal-ai/kling-video/v1.6/standard/text-to-video", body),
      { maxAttempts: 2, initialDelayMs: 5000 }
    );
  }

  async getJobStatus(jobId: string): Promise<VideoJobResult> {
    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/queue/requests/${jobId}`, {
        headers: { Authorization: `Key ${this.apiKey}` },
      });

      if (!response.ok) throw new Error(`Kling status check failed: ${response.status}`);

      const json = (await response.json()) as {
        status: string;
        response?: { video?: { url: string } };
      };

      const status = this.mapStatus(json.status);
      const durationS = 5;
      return {
        jobId,
        status,
        videoUrl: json.response?.video?.url,
        cost: { costUsd: (durationS / 5) * COST_PER_5S },
      };
    }, { maxAttempts: 3, initialDelayMs: 2000 });
  }

  private async submitJob(endpoint: string, body: object): Promise<VideoJobResult> {
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Kling job submission failed: ${response.status} ${await response.text()}`);

    const json = (await response.json()) as { request_id: string };
    return {
      jobId: json.request_id,
      status: "pending",
      cost: { costUsd: COST_PER_5S },
    };
  }

  private mapStatus(falStatus: string): VideoJobResult["status"] {
    if (falStatus === "COMPLETED") return "completed";
    if (falStatus === "FAILED") return "failed";
    if (falStatus === "IN_PROGRESS") return "processing";
    return "pending";
  }
}
