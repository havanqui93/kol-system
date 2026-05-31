import OpenAI from "openai";
import type { LLMMessage, LLMGenerateOptions, LLMResult, LLMProvider, ProviderCost } from "../types.js";
import { withRetry } from "../retry.js";

const INPUT_COST_PER_1K = 0.000005;   // gpt-4o pricing
const OUTPUT_COST_PER_1K = 0.000015;

export class OpenAILLMProvider implements LLMProvider {
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey?: string, model = "gpt-4o") {
    this.client = new OpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY });
    this.defaultModel = model;
  }

  async generate(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMResult> {
    return withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: options?.model ?? this.defaultModel,
        max_tokens: options?.maxTokens ?? 2048,
        temperature: options?.temperature ?? 0.7,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        response_format: options?.responseFormat === "json" ? { type: "json_object" } : undefined,
      });

      const text = response.choices[0]?.message.content ?? "";
      const usage = response.usage!;
      const cost = this.calcCost(usage.prompt_tokens, usage.completion_tokens);
      return { text, cost };
    });
  }

  async generateJSON<T>(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<{ data: T; cost: ProviderCost }> {
    const result = await this.generate(messages, { ...options, responseFormat: "json" });
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
