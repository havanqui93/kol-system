import type { LLMProvider } from "@kol/providers";
import { buildPublisherMetaMessages, type PublisherMetaInput, type PublisherMetaOutput } from "../prompts/publisher.js";

export class PublisherAgent {
  constructor(private llm: LLMProvider) {}

  async generateMeta(input: PublisherMetaInput): Promise<{ output: PublisherMetaOutput; costUsd: number }> {
    const messages = buildPublisherMetaMessages(input);
    const { data, cost } = await this.llm.generateJSON<PublisherMetaOutput>(messages, {
      model: "claude-haiku-4-5-20251001",
      maxTokens: 512,
    });
    return { output: data, costUsd: cost.costUsd };
  }
}
