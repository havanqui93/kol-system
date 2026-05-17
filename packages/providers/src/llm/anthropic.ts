import Anthropic from "@anthropic-ai/sdk";
import type { LLMMessage, LLMGenerateOptions, LLMResult, LLMProvider, ProviderCost } from "../types.js";

const INPUT_COST_PER_1K = 0.000003;   // claude-sonnet-4-6 pricing
const OUTPUT_COST_PER_1K = 0.000015;

export class AnthropicLLMProvider implements LLMProvider {
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey?: string, model = "claude-sonnet-4-6") {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
    this.defaultModel = model;
  }

  async generate(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMResult> {
    const system = messages.find((m) => m.role === "system")?.content;
    const userMessages = messages.filter((m) => m.role !== "system");

    const response = await this.client.messages.create({
      model: options?.model ?? this.defaultModel,
      max_tokens: options?.maxTokens ?? 2048,
      system,
      messages: userMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const cost = this.calcCost(response.usage.input_tokens, response.usage.output_tokens);
    return { text, cost };
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

  private calcCost(inputTokens: number, outputTokens: number): ProviderCost {
    return {
      costUsd: (inputTokens / 1000) * INPUT_COST_PER_1K + (outputTokens / 1000) * OUTPUT_COST_PER_1K,
      inputTokens,
      outputTokens,
    };
  }
}
