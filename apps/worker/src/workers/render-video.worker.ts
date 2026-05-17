import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { prisma } from "@kol/database";
import { R2StorageProvider } from "@kol/providers";
import type { RenderVideoJobPayload } from "@kol/queue";
import { QUEUE_NAMES } from "@kol/queue";

const execFileAsync = promisify(execFile);

export function createRenderVideoWorker(connection: Redis) {
  return new Worker<RenderVideoJobPayload>(
    QUEUE_NAMES.RENDER_VIDEO,
    async (job) => {
      const { projectId, renderJobId, audioUrl, subtitleUrl, backgroundMusicUrl, outputWidth = 1080, outputHeight = 1920 } =
        job.data;

      await prisma.renderJob.update({ where: { id: renderJobId }, data: { status: "processing", startedAt: new Date() } });

      const storage = new R2StorageProvider();
      const workDir = await mkdtemp(join(tmpdir(), "kol-render-"));

      try {
        const scenes = await prisma.videoScene.findMany({
          where: { projectId, status: "completed", clipUrl: { not: null } },
          orderBy: { sceneIndex: "asc" },
        });

        await job.updateProgress(10);

        // Build FFmpeg concat list
        const concatListPath = join(workDir, "concat.txt");
        const concatLines: string[] = [];

        for (const scene of scenes) {
          if (scene.clipUrl) {
            const localPath = join(workDir, `scene-${scene.sceneIndex}.mp4`);
            // Download clip
            const res = await fetch(scene.clipUrl);
            const buf = Buffer.from(await res.arrayBuffer());
            await writeFile(localPath, buf);
            concatLines.push(`file '${localPath}'`);
            concatLines.push(`duration ${scene.durationSeconds}`);
          }
        }

        await writeFile(concatListPath, concatLines.join("\n"));
        await job.updateProgress(30);

        const outputPath = join(workDir, "final.mp4");

        // FFmpeg: concatenate clips + overlay audio + subtitles
        const ffmpegArgs = buildFFmpegArgs({
          concatListPath,
          audioUrl,
          subtitleUrl,
          backgroundMusicUrl,
          outputPath,
          width: outputWidth,
          height: outputHeight,
        });

        await execFileAsync("ffmpeg", ffmpegArgs, { timeout: 300_000 });

        await job.updateProgress(80);

        // Upload final video
        const { readFile } = await import("node:fs/promises");
        const finalBuffer = await readFile(outputPath);
        const outputKey = `projects/${projectId}/final/video.mp4`;
        const finalVideoUrl = await storage.upload(outputKey, finalBuffer, { contentType: "video/mp4", isPublic: true });

        await prisma.$transaction([
          prisma.generatedAsset.create({
            data: { projectId, assetType: "final_video", url: finalVideoUrl, mimeType: "video/mp4" },
          }),
          prisma.renderJob.update({
            where: { id: renderJobId },
            data: { status: "completed", outputUrl: finalVideoUrl, completedAt: new Date() },
          }),
          prisma.videoProject.update({
            where: { id: projectId },
            data: { status: "qa_checking", finalVideoUrl },
          }),
        ]);

        await job.updateProgress(100);
        return { finalVideoUrl };
      } catch (error) {
        await prisma.renderJob.update({
          where: { id: renderJobId },
          data: { status: "failed", errorMessage: String(error), attempts: { increment: 1 } },
        });
        await prisma.videoProject.update({ where: { id: projectId }, data: { status: "failed", errorMessage: String(error) } });
        throw error;
      } finally {
        await rm(workDir, { recursive: true, force: true });
      }
    },
    { connection, concurrency: 2 }
  );
}

function buildFFmpegArgs(opts: {
  concatListPath: string;
  audioUrl: string;
  subtitleUrl?: string;
  backgroundMusicUrl?: string;
  outputPath: string;
  width: number;
  height: number;
}): string[] {
  const args = [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", opts.concatListPath,
    "-i", opts.audioUrl,
  ];

  if (opts.backgroundMusicUrl) {
    args.push("-i", opts.backgroundMusicUrl);
  }

  args.push(
    "-vf", `scale=${opts.width}:${opts.height}:force_original_aspect_ratio=decrease,pad=${opts.width}:${opts.height}:(ow-iw)/2:(oh-ih)/2`,
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "23",
    "-c:a", "aac",
    "-b:a", "128k",
    "-shortest",
    "-movflags", "+faststart",
    opts.outputPath
  );

  return args;
}
