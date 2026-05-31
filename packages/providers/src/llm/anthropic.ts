import Anthropic from "@anthropic-ai/sdk";
import type { LLMMessage, LLMGenerateOptions, LLMResult, LLMProvider, ProviderCost } from "../types.js";
import { withRetry } from "../retry.js";

// claude-sonnet-4-6 pricing
const INPUT_COST_PER_1K = 0.000003;
const OUTPUT_COST_PER_1K = 0.000015;
const CACHE_WRITE_PER_1K = 0.00000375;
const CACHE_READ_PER_1K = 0.0000003;

export class AnthropicLLMProvider implements LLMProvider {
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey?: string, model = "claude-sonnet-4-6") {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
    this.defaultModel = model;
  }

  async generate(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMResult> {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    return withRetry(async () => {
      const response = await this.client.messages.create({
        model: options?.model ?? this.defaultModel,
        max_tokens: options?.maxTokens ?? 2048,
        // Enable prompt caching on the system prompt (large static prompts)
        system: systemMsg
          ? [
              {
                type: "text",
                text: systemMsg.content,
                cache_control: { type: "ephemeral" },
              } as Anthropic.TextBlockParam & { cache_control: { type: "ephemeral" } },
            ]
          : undefined,
        messages: userMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      });

      const text = response.content[0]?.type === "text" ? response.content[0].text : "";
      const cost = this.calcCost(response.usage);
      return { text, cost };
    });
  }

  async generateJSON<T>(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<{ data: T; cost: ProviderCost }> {
    const jsonMessages: LLMMessage[] = [
      ...messages,
      { role: "user", content: "Respond ONLY with valid JSON. No markdown fences or explanation." },
    ];
    const result = await this.generate(jsonMessages, options);
    const data = JSON.parse(result.text) as T;
    return { data, cost: result.cost };
  }

  private calcCost(usage: Anthropic.Usage & { cache_creation_input_tokens?: number; cache_read_input_tokens?: number }): ProviderCost {
    const cacheWrite = usage.cache_creation_input_tokens ?? 0;
    const cacheRead = usage.cache_read_input_tokens ?? 0;
    const normalInput = usage.input_tokens - cacheWrite - cacheRead;

    const costUsd =
      (normalInput / 1000) * INPUT_COST_PER_1K +
      (cacheWrite / 1000) * CACHE_WRITE_PER_1K +
      (cacheRead / 1000) * CACHE_READ_PER_1K +
      (usage.output_tokens / 1000) * OUTPUT_COST_PER_1K;

    return {
      costUsd,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
    };
  }
}
