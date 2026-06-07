import { createQueues, type Queues } from "@kol/queue";
import type { Queue } from "bullmq";
import { redis } from "./redis.js";

const globalForQueues = globalThis as unknown as { queues: Queues };

export const queues: Queues = globalForQueues.queues ?? createQueues(redis as any);

if (process.env.NODE_ENV !== "production") {
  globalForQueues.queues = queues;
}

// Short queue names used by admin/retry API routes.
export type ShortQueueName = "script" | "audio" | "kling" | "render" | "publish";

const shortNameToQueue: Record<ShortQueueName, Queue> = {
  script: queues.generateScript,
  audio: queues.generateAudio,
  kling: queues.generateKlingVideo,
  render: queues.renderVideo,
  publish: queues.publishVideo,
};

// Resolve a BullMQ queue by its short name (e.g. "publish" → publishVideo).
export function getQueue(name: ShortQueueName): Queue {
  return shortNameToQueue[name];
}
