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
const FPS = 30;

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
        const project = await prisma.videoProject.findUnique({
          where: { id: projectId },
          include: { product: true },
        });

        const scenes = await prisma.videoScene.findMany({
          where: { projectId, status: "completed" },
          orderBy: { sceneIndex: "asc" },
        });

        await job.updateProgress(10);

        // Build FFmpeg concat list
        const concatListPath = join(workDir, "concat.txt");
        const concatLines: string[] = [];
        const productImagePath = project?.product?.imageUrls[0]
          ? join(workDir, "product-image")
          : undefined;

        if (project?.product?.imageUrls[0] && productImagePath) {
          await downloadToFile(project.product.imageUrls[0], productImagePath);
        }

        for (const scene of scenes) {
          const localPath = join(workDir, `scene-${scene.sceneIndex}.mp4`);

          if (scene.clipUrl) {
            await downloadToFile(scene.clipUrl, localPath);
          } else {
            await createFallbackSceneClip({
              outputPath: localPath,
              textPath: join(workDir, `scene-${scene.sceneIndex}.txt`),
              imagePath: productImagePath,
              productName: project?.product?.name ?? project?.title ?? "KOL Video",
              visualType: scene.visualType,
              audioSegment: scene.audioSegment ?? "",
              durationSeconds: scene.durationSeconds,
              width: outputWidth,
              height: outputHeight,
            });
          }

          concatLines.push(`file '${localPath}'`);
          concatLines.push(`duration ${scene.durationSeconds}`);
        }

        if (concatLines.length === 0) {
          throw new Error("No completed video clips found for render");
        }

        await writeFile(concatListPath, concatLines.join("\n"));
        await job.updateProgress(30);

        const localSubtitlePath = subtitleUrl ? join(workDir, "captions.srt") : undefined;
        if (subtitleUrl && localSubtitlePath) {
          await downloadToFile(subtitleUrl, localSubtitlePath);
        }

        const outputPath = join(workDir, "final.mp4");

        // FFmpeg: concatenate clips + overlay audio + subtitles
        const ffmpegArgs = buildFFmpegArgs({
          concatListPath,
          audioUrl,
          subtitlePath: localSubtitlePath,
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
    { connection, concurrency: Number(process.env.WORKER_CONCURRENCY_RENDER ?? "2") }
  );
}

async function downloadToFile(url: string, path: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download render asset: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(path, buf);
}

async function createFallbackSceneClip(opts: {
  outputPath: string;
  textPath: string;
  imagePath?: string;
  productName: string;
  visualType: string;
  audioSegment: string;
  durationSeconds: number;
  width: number;
  height: number;
}) {
  const sceneText = buildSceneText(opts.productName, opts.visualType, opts.audioSegment);
  await writeFile(opts.textPath, sceneText, "utf-8");

  const drawText = `drawtext=textfile='${escapeFilterPath(opts.textPath)}':fontcolor=white:fontsize=42:line_spacing=12:box=1:boxcolor=black@0.58:boxborderw=24:x=(w-text_w)/2:y=h-(text_h+220)`;
  const baseVideo = opts.imagePath
    ? [
        "-loop", "1",
        "-framerate", String(FPS),
        "-t", String(opts.durationSeconds),
        "-i", opts.imagePath,
        "-vf",
        [
          `scale=${opts.width}:${opts.height}:force_original_aspect_ratio=decrease`,
          `pad=${opts.width}:${opts.height}:(ow-iw)/2:(oh-ih)/2`,
          drawText,
        ].join(","),
      ]
    : [
        "-f", "lavfi",
        "-i", `color=c=0x111827:s=${opts.width}x${opts.height}:r=${FPS}:d=${opts.durationSeconds}`,
        "-vf", drawText,
      ];

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      ...baseVideo,
      "-an",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      opts.outputPath,
    ],
    { timeout: 120_000 }
  );
}

function buildSceneText(productName: string, visualType: string, audioSegment: string) {
  const source = audioSegment.trim() || productName;
  const label = visualType === "cta_screen" ? "Mua ngay hôm nay" : productName;
  const cleaned = source.replace(/\s+/g, " ").slice(0, 120);
  return wrapText(`${label}\n${cleaned}`, 28);
}

function wrapText(text: string, maxLineLength: number) {
  return text
    .split("\n")
    .flatMap((paragraph) => {
      const words = paragraph.split(" ");
      const lines: string[] = [];
      let line = "";

      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (next.length > maxLineLength && line) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      }

      if (line) lines.push(line);
      return lines;
    })
    .join("\n");
}

function escapeSubtitlePath(path: string) {
  return path.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function escapeFilterPath(path: string) {
  return path.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function buildFFmpegArgs(opts: {
  concatListPath: string;
  audioUrl: string;
  subtitlePath?: string;
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

  const videoFilters = [
    `scale=${opts.width}:${opts.height}:force_original_aspect_ratio=decrease`,
    `pad=${opts.width}:${opts.height}:(ow-iw)/2:(oh-ih)/2`,
  ];

  if (opts.subtitlePath) {
    videoFilters.push(
      `subtitles='${escapeSubtitlePath(opts.subtitlePath)}':force_style='FontName=Arial,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=2,Shadow=0,Alignment=2,MarginV=120'`
    );
  }

  if (opts.backgroundMusicUrl) {
    args.push(
      "-filter_complex",
      "[1:a]volume=1.0[voice];[2:a]volume=0.18,aloop=loop=-1:size=2e+09[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]",
      "-map", "0:v",
      "-map", "[aout]"
    );
  } else {
    args.push("-map", "0:v", "-map", "1:a");
  }

  args.push(
    "-vf", videoFilters.join(","),
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
