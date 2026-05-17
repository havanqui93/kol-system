import type { LLMMessage } from "@kol/providers";

export interface QACheckInput {
  fullScript: string;
  estimatedDurationSeconds: number;
  platform: string;
  hasAudio: boolean;
  hasSubtitles: boolean;
  hasAllScenes: boolean;
  hasCTA: boolean;
  productClaims: string[];
}

export interface QAOutput {
  passed: boolean;
  score: number; // 0-100
  issues: Array<{
    severity: "error" | "warning" | "info";
    field: string;
    message: string;
  }>;
  suggestions: string[];
}

export function buildQAMessages(input: QACheckInput): LLMMessage[] {
  return [
    {
      role: "system",
      content: `Bạn là chuyên gia QA content video KOL.
Kiểm tra script và metadata video để đảm bảo chất lượng trước khi render.
Tập trung vào: tính thuyết phục, an toàn pháp lý, đồng bộ kỹ thuật, phù hợp nền tảng.
Luôn trả về JSON hợp lệ.`,
    },
    {
      role: "user",
      content: `Kiểm tra chất lượng video KOL:

Script: "${input.fullScript}"
Thời lượng ước tính: ${input.estimatedDurationSeconds}s
Nền tảng: ${input.platform}
Có audio: ${input.hasAudio}
Có phụ đề: ${input.hasSubtitles}
Đủ cảnh: ${input.hasAllScenes}
Có CTA: ${input.hasCTA}
Tuyên bố sản phẩm: ${input.productClaims.join(", ")}

Kiểm tra:
1. Script có CTA rõ ràng không?
2. Thời lượng có phù hợp nền tảng không? (TikTok: 15-60s, Reels: 15-90s)
3. Tuyên bố sản phẩm có cần bằng chứng không? (tránh: "100% hiệu quả", "chữa khỏi", "đảm bảo")
4. Script có bị lặp từ quá nhiều không?
5. Hook có đủ mạnh không?
6. Ngôn ngữ có tự nhiên không?

Trả về JSON:
{
  "passed": boolean,
  "score": number,  // 0-100
  "issues": [
    { "severity": "error" | "warning" | "info", "field": string, "message": string }
  ],
  "suggestions": string[]
}`,
    },
  ];
}
