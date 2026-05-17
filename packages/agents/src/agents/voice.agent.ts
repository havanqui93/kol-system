import type { TTSProvider, StorageProvider } from "@kol/providers";
import type { ScriptOutput } from "../prompts/script.js";

export interface VoiceAgentOptions {
  voiceId?: string;
  gender?: "male" | "female";
  style?: "energetic" | "professional" | "funny" | "calm" | "authoritative";
  language?: string;
  projectId: string;
}

export interface VoiceAgentResult {
  audioUrl: string;
  durationMs: number;
  costUsd: number;
}

export class VoiceAgent {
  constructor(
    private tts: TTSProvider,
    private storage: StorageProvider
  ) {}

  async run(script: ScriptOutput, options: VoiceAgentOptions): Promise<VoiceAgentResult> {
    const result = await this.tts.synthesize(script.fullScript, {
      voiceId: options.voiceId,
      gender: options.gender ?? "female",
      style: options.style ?? "energetic",
      language: options.language ?? "vi",
    });

    // Upload base64 audio to storage
    let audioUrl = result.audioUrl;
    if (audioUrl.startsWith("data:")) {
      const base64Data = audioUrl.split(",")[1]!;
      const buffer = Buffer.from(base64Data, "base64");
      const key = `projects/${options.projectId}/audio/voiceover.mp3`;
      audioUrl = await this.storage.upload(key, buffer, { contentType: "audio/mpeg", isPublic: true });
    }

    return {
      audioUrl,
      durationMs: result.durationMs,
      costUsd: result.cost.costUsd,
    };
  }
}
