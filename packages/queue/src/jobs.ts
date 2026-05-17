// BullMQ job payload types — one interface per queue job

// ─── generate-script-job ─────────────────────────────────────────────────────

export interface GenerateScriptJobPayload {
  projectId: string;
  userId: string;
  budgetLimitUsd?: number;
}

// ─── generate-audio-job ──────────────────────────────────────────────────────

export interface GenerateAudioJobPayload {
  projectId: string;
  userId: string;
  scriptId: string;
  voiceId?: string;
  voiceGender?: "male" | "female";
  voiceStyle?: "energetic" | "professional" | "funny" | "calm" | "authoritative";
  language?: string;
}

// ─── generate-kling-video-job ────────────────────────────────────────────────

export interface GenerateKlingVideoJobPayload {
  projectId: string;
  userId: string;
  sceneId: string;
  sceneIndex: number;
  visualType: string;
  klingPrompt: string;
  negativePrompt?: string;
  sourceImageUrl?: string;  // for image-to-video
  durationSeconds: number;
}

// ─── generate-subtitle-job ───────────────────────────────────────────────────

export interface GenerateSubtitleJobPayload {
  projectId: string;
  userId: string;
  audioUrl: string;
  scriptId: string;
  language?: string;
}

// ─── render-video-job ────────────────────────────────────────────────────────

export interface RenderVideoJobPayload {
  projectId: string;
  userId: string;
  renderJobId: string;
  audioUrl: string;
  subtitleUrl?: string;
  backgroundMusicUrl?: string;
  watermarkUrl?: string;
  outputWidth?: number;
  outputHeight?: number;
}

// ─── qa-video-job ────────────────────────────────────────────────────────────

export interface QAVideoJobPayload {
  projectId: string;
  userId: string;
  scriptId: string;
  finalVideoUrl?: string;
  audioUrl?: string;
}

// ─── publish-video-job ───────────────────────────────────────────────────────

export interface PublishVideoJobPayload {
  projectId: string;
  userId: string;
  publishJobId: string;
  platform: "tiktok" | "facebook" | "youtube_shorts";
  socialAccountId: string;
  finalVideoUrl: string;
  title: string;
  description: string;
  hashtags: string[];
  scheduledAt?: string; // ISO date string
}

// ─── Union type ───────────────────────────────────────────────────────────────

export type AnyJobPayload =
  | GenerateScriptJobPayload
  | GenerateAudioJobPayload
  | GenerateKlingVideoJobPayload
  | GenerateSubtitleJobPayload
  | RenderVideoJobPayload
  | QAVideoJobPayload
  | PublishVideoJobPayload;
