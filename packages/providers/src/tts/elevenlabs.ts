import type { TTSProvider, TTSOptions, TTSResult, TTSGender, TTSVoiceStyle, TTSLanguage } from "../types.js";
import { withRetry } from "../retry.js";

const COST_PER_CHAR = 0.00003; // ElevenLabs Creator plan ~$22/1M chars

// Curated Vietnamese-capable voice IDs on ElevenLabs
const VI_VOICES = {
  female_energetic: "EXAVITQu4vr4xnSDxMaL",
  female_professional: "21m00Tcm4TlvDq8ikWAM",
  male_professional: "pNInz6obpgDQGcFmaJgB",
  male_energetic: "VR6AewLTigWG4xSOukaG",
};

export class ElevenLabsTTSProvider implements TTSProvider {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.ELEVENLABS_API_KEY ?? "";
  }

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
    const voiceId = options?.voiceId ?? this.resolveVoiceId(options?.gender, options?.style);

    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}/with-timestamps`, {
        method: "POST",
        headers: { "xi-api-key": this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          language_code: options?.language === "vi" ? "vi" : "en",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs TTS failed: ${response.status} ${errText}`);
      }

      const json = (await response.json()) as {
        audio_base64: string;
        alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[] };
      };

      const durationMs = (json.alignment.character_end_times_seconds.at(-1) ?? 0) * 1000;

      return {
        audioUrl: `data:audio/mpeg;base64,${json.audio_base64}`,
        durationMs,
        cost: { costUsd: text.length * COST_PER_CHAR, durationMs },
      };
    }, { maxAttempts: 3, initialDelayMs: 2000 });
  }

  async listVoices(_language?: TTSLanguage) {
    return [
      { id: VI_VOICES.female_energetic, name: "Sara (Energetic)", gender: "female" as TTSGender, style: "energetic" as TTSVoiceStyle },
      { id: VI_VOICES.female_professional, name: "Rachel (Professional)", gender: "female" as TTSGender, style: "professional" as TTSVoiceStyle },
      { id: VI_VOICES.male_professional, name: "Adam (Professional)", gender: "male" as TTSGender, style: "professional" as TTSVoiceStyle },
      { id: VI_VOICES.male_energetic, name: "Sam (Energetic)", gender: "male" as TTSGender, style: "energetic" as TTSVoiceStyle },
    ];
  }

  private resolveVoiceId(gender?: TTSGender, style?: TTSVoiceStyle): string {
    const key = `${gender ?? "female"}_${style ?? "energetic"}` as keyof typeof VI_VOICES;
    return VI_VOICES[key] ?? VI_VOICES.female_energetic;
  }
}
