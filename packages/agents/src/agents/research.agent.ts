import type { LLMProvider } from "@kol/providers";
import { buildResearchMessages, type ResearchOutput } from "../prompts/research.js";
import type { IntakeOutput } from "../prompts/intake.js";

export class ResearchAgent {
  constructor(private llm: LLMProvider) {}

  async run(context: IntakeOutput["normalizedContext"]): Promise<{ output: ResearchOutput; costUsd: number }> {
    const messages = buildResearchMessages(context);
    const { data, cost } = await this.llm.generateJSON<ResearchOutput>(messages, {
      model: "claude-haiku-4-5-20251001",
      maxTokens: 1024,
    });
    return { output: data, costUsd: cost.costUsd };
  }
}
