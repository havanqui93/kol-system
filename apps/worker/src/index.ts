import Redis from "ioredis";
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

const workers = [
  createGenerateScriptWorker(connection),
  createGenerateAudioWorker(connection),
  createGenerateKlingWorker(connection),
  createRenderVideoWorker(connection),
  createPublishVideoWorker(connection),
];

for (const worker of workers) {
  worker.on("completed", (job) => {
    console.log(`[${worker.name}] Job ${job.id} completed`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[${worker.name}] Job ${job?.id} failed:`, err.message);
  });
  worker.on("error", (err) => {
    console.error(`[${worker.name}] Worker error:`, err);
  });
}

console.log(`KOL Worker started. Listening on ${REDIS_URL}`);
console.log(`Active workers: ${workers.map((w) => w.name).join(", ")}`);

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down workers...");
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
