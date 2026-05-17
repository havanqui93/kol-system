import type { LLMProvider } from "@kol/providers";
import { buildVisualPlanMessages, type VisualPlanOutput } from "../prompts/visual-plan.js";
import type { ScriptOutput } from "../prompts/script.js";

export class VisualPlanAgent {
  constructor(private llm: LLMProvider) {}

  async run(
    script: ScriptOutput,
    context: { productName: string; platform: string; videoType: string; hasKolAvatar: boolean; hasProductImage: boolean }
  ): Promise<{ output: VisualPlanOutput; costUsd: number }> {
    const messages = buildVisualPlanMessages(script, context);
    const { data, cost } = await this.llm.generateJSON<VisualPlanOutput>(messages, {
      model: "claude-haiku-4-5-20251001",
      maxTokens: 2048,
    });
    return { output: data, costUsd: cost.costUsd };
  }
}
