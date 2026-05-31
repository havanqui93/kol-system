import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import { prisma } from "@kol/database";
import { ElevenLabsTTSProvider, WhisperSubtitleProvider, R2StorageProvider } from "@kol/providers";
import { VoiceAgent, SubtitleAgent } from "@kol/agents";
import type { GenerateAudioJobPayload } from "@kol/queue";
import { QUEUE_NAMES } from "@kol/queue";

export function createGenerateAudioWorker(connection: Redis) {
  return new Worker<GenerateAudioJobPayload>(
    QUEUE_NAMES.GENERATE_AUDIO,
    async (job) => {
      const { projectId, userId, scriptId, voiceId, voiceGender, voiceStyle, language } = job.data;

      const script = await prisma.videoScript.findUnique({ where: { id: scriptId } });
      if (!script) throw new Error(`Script ${scriptId} not found`);

      const tts = new ElevenLabsTTSProvider();
      const storage = new R2StorageProvider();
      const voiceAgent = new VoiceAgent(tts, storage);

      await job.updateProgress(20);

      const scriptOutput = {
        fullScript: script.fullScript,
        estimatedDurationSeconds: script.estimatedDurationSeconds ?? 30,
        // other fields aren't needed for TTS
      } as any;

      const { audioUrl, durationMs, costUsd } = await voiceAgent.run(scriptOutput, {
        projectId,
        voiceId,
        gender: voiceGender,
        style: voiceStyle,
        language: language ?? "vi",
      });

      await job.updateProgress(60);

      // Generate subtitles from audio via Whisper
      const subtitleProvider = new WhisperSubtitleProvider();
      const subtitleAgent = new SubtitleAgent(subtitleProvider);
      const subtitleResult = await subtitleAgent.fromAudio(audioUrl, language ?? "vi");

      // Upload SRT to storage
      const srtKey = `projects/${projectId}/subtitles/captions.srt`;
      const srtBuffer = Buffer.from(subtitleResult.srtContent, "utf-8");
      const srtUrl = await storage.upload(srtKey, srtBuffer, { contentType: "text/plain", isPublic: true });

      await job.updateProgress(85);

      await prisma.$transaction([
        prisma.generatedAsset.create({
          data: {
            projectId,
            assetType: "audio",
            url: audioUrl,
            mimeType: "audio/mpeg",
            durationMs,
          },
        }),
        prisma.generatedAsset.create({
          data: {
            projectId,
            assetType: "subtitle",
            url: srtUrl,
            mimeType: "text/plain",
          },
        }),
        prisma.videoProject.update({
          where: { id: projectId },
          data: { status: "audio_ready" },
        }),
        prisma.costTracking.update({
          where: { projectId },
          data: {
            ttsCostUsd: { increment: costUsd },
            subtitleCostUsd: { increment: subtitleResult.costUsd },
            totalCostUsd: { increment: costUsd + subtitleResult.costUsd },
          },
        }),
      ]);

      await job.updateProgress(100);
      return { audioUrl, durationMs, costUsd };
    },
    { connection, concurrency: Number(process.env.WORKER_CONCURRENCY_AUDIO ?? "5") }
  );
}
