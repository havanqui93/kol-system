import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import type {
  GenerateScriptJobPayload,
  GenerateAudioJobPayload,
  GenerateKlingVideoJobPayload,
  GenerateSubtitleJobPayload,
  RenderVideoJobPayload,
  QAVideoJobPayload,
  PublishVideoJobPayload,
} from "./jobs.js";

export const QUEUE_NAMES = {
  GENERATE_SCRIPT: "generate-script",
  GENERATE_AUDIO: "generate-audio",
  GENERATE_KLING_VIDEO: "generate-kling-video",
  GENERATE_SUBTITLE: "generate-subtitle",
  RENDER_VIDEO: "render-video",
  QA_VIDEO: "qa-video",
  PUBLISH_VIDEO: "publish-video",
} as const;

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { age: 86400, count: 100 },
  removeOnFail: { age: 604800 },
};

export function createQueues(connection: Redis) {
  return {
    generateScript: new Queue<GenerateScriptJobPayload>(QUEUE_NAMES.GENERATE_SCRIPT, {
      connection,
      defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 2 },
    }),

    generateAudio: new Queue<GenerateAudioJobPayload>(QUEUE_NAMES.GENERATE_AUDIO, {
      connection,
      defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 3 },
    }),

    generateKlingVideo: new Queue<GenerateKlingVideoJobPayload>(QUEUE_NAMES.GENERATE_KLING_VIDEO, {
      connection,
      defaultJobOptions: {
        ...DEFAULT_JOB_OPTIONS,
        attempts: 2,
        // Kling can take 3-5 min per clip — set generous timeout
      },
    }),

    generateSubtitle: new Queue<GenerateSubtitleJobPayload>(QUEUE_NAMES.GENERATE_SUBTITLE, {
      connection,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    }),

    renderVideo: new Queue<RenderVideoJobPayload>(QUEUE_NAMES.RENDER_VIDEO, {
      connection,
      defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 2 },
    }),

    qaVideo: new Queue<QAVideoJobPayload>(QUEUE_NAMES.QA_VIDEO, {
      connection,
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    }),

    publishVideo: new Queue<PublishVideoJobPayload>(QUEUE_NAMES.PUBLISH_VIDEO, {
      connection,
      defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, attempts: 5 },
    }),
  };
}

export type Queues = ReturnType<typeof createQueues>;
