import type { LLMProvider } from "@kol/providers";
import { buildScriptMessages, type ScriptOutput } from "../prompts/script.js";
import type { IntakeOutput } from "../prompts/intake.js";
import type { ResearchOutput } from "../prompts/research.js";

export class ScriptAgent {
  constructor(private llm: LLMProvider) {}

  async run(
    context: IntakeOutput["normalizedContext"],
    research: ResearchOutput,
    durationSeconds: 15 | 30 | 45 | 60
  ): Promise<{ output: ScriptOutput; costUsd: number }> {
    const messages = buildScriptMessages(context, research, durationSeconds);

    // Use Sonnet for final script — quality matters here
    const { data, cost } = await this.llm.generateJSON<ScriptOutput>(messages, {
      model: "claude-sonnet-4-6",
      maxTokens: 2048,
      temperature: 0.8,
    });

    return { output: data, costUsd: cost.costUsd };
  }

  async regenerate(
    context: IntakeOutput["normalizedContext"],
    research: ResearchOutput,
    durationSeconds: 15 | 30 | 45 | 60,
    feedback?: string
  ): Promise<{ output: ScriptOutput; costUsd: number }> {
    const messages = buildScriptMessages(context, research, durationSeconds);

    if (feedback) {
      messages.push({
        role: "user",
        content: `Viết lại script với phản hồi sau: ${feedback}\n\nVẫn trả về JSON theo schema cũ.`,
      });
    }

    const { data, cost } = await this.llm.generateJSON<ScriptOutput>(messages, {
      model: "claude-sonnet-4-6",
      maxTokens: 2048,
      temperature: 0.9,
    });

    return { output: data, costUsd: cost.costUsd };
  }
}
