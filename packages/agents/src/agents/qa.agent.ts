import type { LLMProvider } from "@kol/providers";
import { buildQAMessages, type QACheckInput, type QAOutput } from "../prompts/qa.js";

export class QAAgent {
  constructor(private llm: LLMProvider) {}

  async run(input: QACheckInput): Promise<{ output: QAOutput; costUsd: number }> {
    const messages = buildQAMessages(input);
    const { data, cost } = await this.llm.generateJSON<QAOutput>(messages, {
      model: "claude-haiku-4-5-20251001",
      maxTokens: 1024,
    });
    return { output: data, costUsd: cost.costUsd };
  }
}
