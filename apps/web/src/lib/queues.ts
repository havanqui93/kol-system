import { createQueues, type Queues } from "@kol/queue";
import { redis } from "./redis.js";

const globalForQueues = globalThis as unknown as { queues: Queues };

export const queues: Queues = globalForQueues.queues ?? createQueues(redis as any);

if (process.env.NODE_ENV !== "production") {
  globalForQueues.queues = queues;
}
