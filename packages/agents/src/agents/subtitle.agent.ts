import type { SubtitleProvider } from "@kol/providers";
import type { ScriptOutput } from "../prompts/script.js";

export interface SubtitleAgentResult {
  srtContent: string;
  vttContent: string;
  segmentCount: number;
  costUsd: number;
}

export class SubtitleAgent {
  constructor(private subtitleProvider: SubtitleProvider) {}

  async fromAudio(audioUrl: string, language = "vi"): Promise<SubtitleAgentResult> {
    const result = await this.subtitleProvider.transcribe(audioUrl, {
      language,
      wordLevel: true,
    });

    return {
      srtContent: result.srtContent,
      vttContent: result.vttContent,
      segmentCount: result.segments.length,
      costUsd: result.cost.costUsd,
    };
  }

  fromScript(script: ScriptOutput): SubtitleAgentResult {
    // Use word timings if TTS provided them; otherwise fallback to equal distribution
    const dummyTimings = script.fullScript
      .split(/\s+/)
      .filter(Boolean)
      .map((word, i, arr) => {
        const totalMs = script.estimatedDurationSeconds * 1000;
        const msPerWord = totalMs / arr.length;
        return { word, startMs: Math.round(i * msPerWord), endMs: Math.round((i + 1) * msPerWord) };
      });

    const result = this.subtitleProvider.fromScript(script.fullScript, dummyTimings);
    return {
      srtContent: result.srtContent,
      vttContent: result.vttContent,
      segmentCount: result.segments.length,
      costUsd: 0,
    };
  }
}
