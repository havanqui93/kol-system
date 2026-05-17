import type { LLMProvider } from "@kol/providers";
import { buildIntakeMessages, type IntakeInput, type IntakeOutput } from "../prompts/intake.js";

export class IntakeAgent {
  constructor(private llm: LLMProvider) {}

  async run(input: IntakeInput): Promise<{ output: IntakeOutput; costUsd: number }> {
    const messages = buildIntakeMessages(input);
    const { data, cost } = await this.llm.generateJSON<IntakeOutput>(messages, {
      model: "claude-haiku-4-5-20251001", // cheap model for intake
      maxTokens: 1024,
    });
    return { output: data, costUsd: cost.costUsd };
  }
}
