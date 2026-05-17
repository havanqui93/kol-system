import OpenAI from "openai";
import type { SubtitleProvider, SubtitleOptions, SubtitleResult, SubtitleSegment, WordTiming } from "../types.js";

const COST_PER_MINUTE = 0.006; // OpenAI Whisper pricing

export class WhisperSubtitleProvider implements SubtitleProvider {
  private client: OpenAI;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY });
  }

  async transcribe(audioUrl: string, options?: SubtitleOptions): Promise<SubtitleResult> {
    // Fetch audio from URL
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();
    const audioFile = new File([audioBlob], "audio.mp3", { type: "audio/mpeg" });

    const response = await this.client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: options?.language === "vi" ? "vi" : undefined,
      response_format: "verbose_json",
      timestamp_granularities: options?.wordLevel ? ["word", "segment"] : ["segment"],
    });

    const segments: SubtitleSegment[] = (response as any).segments?.map((s: any) => ({
      startMs: Math.round(s.start * 1000),
      endMs: Math.round(s.end * 1000),
      text: s.text.trim(),
      words: s.words?.map((w: any) => ({
        word: w.word,
        startMs: Math.round(w.start * 1000),
        endMs: Math.round(w.end * 1000),
      })),
    })) ?? [];

    const durationMinutes = (segments.at(-1)?.endMs ?? 0) / 60000;
    return {
      segments,
      srtContent: this.toSRT(segments),
      vttContent: this.toVTT(segments),
      cost: { costUsd: durationMinutes * COST_PER_MINUTE, durationMs: (segments.at(-1)?.endMs ?? 0) },
    };
  }

  fromScript(script: string, wordTimings: WordTiming[]): SubtitleResult {
    // Build segments from word timings — group into ~5-word chunks
    const chunkSize = 5;
    const segments: SubtitleSegment[] = [];
    for (let i = 0; i < wordTimings.length; i += chunkSize) {
      const chunk = wordTimings.slice(i, i + chunkSize);
      const first = chunk[0]!;
      const last = chunk[chunk.length - 1]!;
      segments.push({
        startMs: first.startMs,
        endMs: last.endMs,
        text: chunk.map((w) => w.word).join(" "),
        words: chunk,
      });
    }
    return {
      segments,
      srtContent: this.toSRT(segments),
      vttContent: this.toVTT(segments),
      cost: { costUsd: 0 },
    };
  }

  private toSRT(segments: SubtitleSegment[]): string {
    return segments
      .map((s, i) => `${i + 1}\n${this.msToSRTTime(s.startMs)} --> ${this.msToSRTTime(s.endMs)}\n${s.text}`)
      .join("\n\n");
  }

  private toVTT(segments: SubtitleSegment[]): string {
    const body = segments
      .map((s) => `${this.msToVTTTime(s.startMs)} --> ${this.msToVTTTime(s.endMs)}\n${s.text}`)
      .join("\n\n");
    return `WEBVTT\n\n${body}`;
  }

  private msToSRTTime(ms: number): string {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const milli = ms % 1000;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(milli).padStart(3, "0")}`;
  }

  private msToVTTTime(ms: number): string {
    return this.msToSRTTime(ms).replace(",", ".");
  }
}
