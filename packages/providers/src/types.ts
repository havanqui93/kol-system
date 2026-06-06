// ─── Shared types ────────────────────────────────────────────────────────────

export interface ProviderCost {
  costUsd: number;
  inputTokens?: number;
  outputTokens?: number;
  durationMs?: number;
}

// ─── LLM Provider ────────────────────────────────────────────────────────────

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMGenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "text" | "json";
}

export interface LLMResult {
  text: string;
  cost: ProviderCost;
}

export interface LLMProvider {
  generate(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMResult>;
  generateJSON<T>(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<{ data: T; cost: ProviderCost }>;
}

// ─── TTS Provider ────────────────────────────────────────────────────────────

export type TTSVoiceStyle = "energetic" | "professional" | "funny" | "calm" | "authoritative";
export type TTSGender = "male" | "female";
export type TTSLanguage = "vi" | "en" | string;

export interface TTSOptions {
  voiceId?: string;
  gender?: TTSGender;
  style?: TTSVoiceStyle;
  language?: TTSLanguage;
  speed?: number;
}

export interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export interface TTSResult {
  audioUrl: string;
  durationMs: number;
  wordTimings?: WordTiming[];
  cost: ProviderCost;
}

export interface TTSProvider {
  synthesize(text: string, options?: TTSOptions): Promise<TTSResult>;
  listVoices(language?: TTSLanguage): Promise<Array<{ id: string; name: string; gender: TTSGender; style: TTSVoiceStyle }>>;
}

// ─── Video Provider (Kling) ───────────────────────────────────────────────────

export type AspectRatio = "9:16" | "16:9" | "1:1";
export type CameraMovement = "static" | "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "tilt_up" | "tilt_down";

export interface ImageToVideoOptions {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  durationSeconds?: number;
  aspectRatio?: AspectRatio;
  cameraMovement?: CameraMovement;
}

export interface TextToVideoOptions {
  prompt: string;
  negativePrompt?: string;
  durationSeconds?: number;
  aspectRatio?: AspectRatio;
  cameraMovement?: CameraMovement;
}

// ─── Motion Control ─────────────────────────────────────────────────────────
// Direct *which* regions of the source image move and *where* they travel,
// instead of letting the model invent random motion. Maps to Kling's
// dynamic_masks (brushed region + trajectory) and static_mask (areas held still).

export interface MotionPoint {
  x: number; // normalized 0..1 relative to image width
  y: number; // normalized 0..1 relative to image height
}

export interface MotionBrush {
  // PNG mask (white = the moving region) hosted at an accessible URL
  maskUrl: string;
  // ordered path the brushed region should follow across the clip
  trajectory: MotionPoint[];
}

export interface MotionControlOptions extends ImageToVideoOptions {
  // regions that should move, each with its own trajectory
  motionBrushes: MotionBrush[];
  // optional mask of regions that must stay still (white = frozen)
  staticMaskUrl?: string;
}

// ─── Face Swap ──────────────────────────────────────────────────────────────
// Replace the face in a generated/source video with a reference face — the
// foundation of a reusable Virtual KOL identity across every video.

export interface FaceSwapOptions {
  // the video whose face(s) will be replaced
  targetVideoUrl: string;
  // the reference face to swap in
  faceImageUrl: string;
}

export interface VideoJobResult {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  cost: ProviderCost;
}

export interface VideoProvider {
  imageToVideo(options: ImageToVideoOptions): Promise<VideoJobResult>;
  textToVideo(options: TextToVideoOptions): Promise<VideoJobResult>;
  getJobStatus(jobId: string): Promise<VideoJobResult>;
  // Optional advanced capabilities — not every provider supports these.
  imageToVideoWithMotion?(options: MotionControlOptions): Promise<VideoJobResult>;
  faceSwap?(options: FaceSwapOptions): Promise<VideoJobResult>;
}

// ─── Subtitle Provider ────────────────────────────────────────────────────────

export interface SubtitleSegment {
  startMs: number;
  endMs: number;
  text: string;
  words?: WordTiming[];
}

export interface SubtitleOptions {
  language?: TTSLanguage;
  wordLevel?: boolean;
}

export interface SubtitleResult {
  segments: SubtitleSegment[];
  srtContent: string;
  vttContent: string;
  cost: ProviderCost;
}

export interface SubtitleProvider {
  transcribe(audioUrl: string, options?: SubtitleOptions): Promise<SubtitleResult>;
  fromScript(script: string, wordTimings: WordTiming[]): SubtitleResult;
}

// ─── Storage Provider ─────────────────────────────────────────────────────────

export interface UploadOptions {
  contentType?: string;
  isPublic?: boolean;
  expiresIn?: number;
}

export interface StorageProvider {
  upload(key: string, data: Buffer | Blob, options?: UploadOptions): Promise<string>;
  uploadFromUrl(key: string, sourceUrl: string): Promise<string>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// ─── Renderer Provider ────────────────────────────────────────────────────────

export interface SceneClip {
  url: string;
  startMs: number;
  durationMs: number;
  type: "video" | "image";
}

export interface RenderOptions {
  width: number;
  height: number;
  fps: number;
  outputFormat: "mp4";
  subtitles?: SubtitleSegment[];
  backgroundMusicUrl?: string;
  musicVolume?: number;
  watermarkUrl?: string;
  ctaText?: string;
  ctaStartMs?: number;
}

export interface RendererProvider {
  render(scenes: SceneClip[], audioUrl: string, options: RenderOptions): Promise<{ outputPath: string; durationMs: number }>;
}

// ─── Publisher Provider ───────────────────────────────────────────────────────

export interface PublishOptions {
  title: string;
  description: string;
  hashtags: string[];
  scheduledAt?: Date;
}

export interface PublishResult {
  platformPostId: string;
  url?: string;
  status: "published" | "scheduled";
}

export interface PublisherProvider {
  publish(videoPath: string, options: PublishOptions): Promise<PublishResult>;
  getStatus(platformPostId: string): Promise<{ status: "published" | "processing" | "failed" }>;
}
