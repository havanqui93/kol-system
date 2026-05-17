import type { LLMMessage } from "@kol/providers";
import type { IntakeOutput } from "./intake.js";
import type { ResearchOutput } from "./research.js";

export interface ScriptOutput {
  hook: string;
  problem: string;
  introduction: string;
  benefits: string;
  proof: string;
  offer: string;
  cta: string;
  fullScript: string;
  wordCount: number;
  estimatedDurationSeconds: number;
  scenes: Array<{
    label: string;
    text: string;
    durationSeconds: number;
  }>;
}

const WORDS_PER_SECOND_VI = 3.5; // Vietnamese spoken pace

export function buildScriptMessages(
  context: IntakeOutput["normalizedContext"],
  research: ResearchOutput,
  durationSeconds: 15 | 30 | 45 | 60
): LLMMessage[] {
  const targetWords = Math.round(durationSeconds * WORDS_PER_SECOND_VI);

  const structureByDuration: Record<number, string> = {
    15: "Hook (3s) → Lợi ích nhanh (8s) → CTA (4s)",
    30: "Hook (4s) → Vấn đề (6s) → Giới thiệu sản phẩm (10s) → Lợi ích (6s) → CTA (4s)",
    45: "Hook (4s) → Vấn đề (8s) → Giới thiệu (10s) → Lợi ích (12s) → Bằng chứng (6s) → CTA (5s)",
    60: "Hook (4s) → Vấn đề (10s) → Giới thiệu (12s) → Lợi ích (14s) → Bằng chứng/Giá (10s) → Ưu đãi (5s) → CTA (5s)",
  };

  return [
    {
      role: "system",
      content: `Bạn là copywriter chuyên viết script video KOL viral cho TikTok và Facebook Reels Việt Nam.
Phong cách: tự nhiên, gần gũi, thuyết phục nhưng không quá lộ liễu.
Ngôn ngữ: Tiếng Việt miền Nam/miền Bắc tự nhiên (tùy context).
Không dùng từ ngữ sáo rỗng, hoa mỹ quá mức.
Không bịa thông tin sản phẩm.
Luôn trả về JSON hợp lệ.`,
    },
    {
      role: "user",
      content: `Viết script video KOL ${durationSeconds} giây cho sản phẩm:

Sản phẩm: ${context.productName}
Mô tả: ${context.productDescription}
Giá: ${context.price}
Khuyến mãi: ${context.promotion}
Điểm bán: ${context.sellingPoints.join(", ")}
Khách hàng: ${context.targetCustomer}

Hook tốt nhất: "${research.hooks[research.bestHookIndex]?.text ?? ""}"
Góc nội dung: ${research.contentAngle}
Trigger cảm xúc: ${research.emotionalTrigger}
Nỗi đau chính: ${research.painPoints.slice(0, 2).join(", ")}
CTA gợi ý: ${research.ctaSuggestion}

Cấu trúc bắt buộc: ${structureByDuration[durationSeconds]}
Số từ mục tiêu: ~${targetWords} từ

Trả về JSON:
{
  "hook": string,             // câu mở đầu gây shock/tò mò
  "problem": string,          // mô tả vấn đề của khách hàng
  "introduction": string,     // giới thiệu sản phẩm tự nhiên
  "benefits": string,         // lợi ích cụ thể, rõ ràng
  "proof": string,            // bằng chứng, số liệu, social proof
  "offer": string,            // ưu đãi/giá
  "cta": string,              // kêu gọi hành động
  "fullScript": string,       // script hoàn chỉnh dạng đọc liên tục
  "wordCount": number,
  "estimatedDurationSeconds": number,
  "scenes": [
    { "label": string, "text": string, "durationSeconds": number }
  ]
}`,
    },
  ];
}
