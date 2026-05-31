import Redis from "ioredis";
import { validateWorkerEnv } from "./env.js";
import { logger } from "./logger.js";

// Fail fast if required env vars are missing
validateWorkerEnv();
import { createGenerateScriptWorker } from "./workers/generate-script.worker.js";
import { createGenerateAudioWorker } from "./workers/generate-audio.worker.js";
import { createGenerateKlingWorker } from "./workers/generate-kling.worker.js";
import { createRenderVideoWorker } from "./workers/render-video.worker.js";
import { createPublishVideoWorker } from "./workers/publish-video.worker.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on("connect", () => logger.info("Redis connected", { url: REDIS_URL }));
connection.on("error", (err) => logger.error("Redis error", { error: err.message }));

const workers = [
  createGenerateScriptWorker(connection),
  createGenerateAudioWorker(connection),
  createGenerateKlingWorker(connection),
  createRenderVideoWorker(connection),
  createPublishVideoWorker(connection),
];

for (const worker of workers) {
  const workerLog = logger.child({ worker: worker.name });

  worker.on("completed", (job) => {
    workerLog.info("Job completed", { jobId: job.id, duration: job.processedOn ? Date.now() - job.processedOn : undefined });
  });

  worker.on("failed", (job, err) => {
    workerLog.error("Job failed", {
      jobId: job?.id,
      error: err.message,
      attempts: job?.attemptsMade,
    });
  });

  worker.on("error", (err) => {
    workerLog.error("Worker error", { error: err.message, stack: err.stack });
  });

  worker.on("active", (job) => {
    workerLog.info("Job started", { jobId: job.id });
  });

  worker.on("stalled", (jobId) => {
    workerLog.warn("Job stalled", { jobId });
  });
}

logger.info("KOL Worker started", {
  redisUrl: REDIS_URL,
  workers: workers.map((w) => w.name),
  nodeVersion: process.version,
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info("Shutting down workers", { signal });
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  logger.info("Workers shut down cleanly");
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason: String(reason) });
});
