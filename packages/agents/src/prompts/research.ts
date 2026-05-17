import type { LLMMessage } from "@kol/providers";
import type { IntakeOutput } from "./intake.js";

export interface ResearchOutput {
  hooks: Array<{
    text: string;
    type: "problem" | "curiosity" | "shocking" | "benefit" | "social_proof";
    score: number; // 1-10 virality estimate
  }>;
  bestHookIndex: number;
  contentAngle: string;
  emotionalTrigger: string;
  painPoints: string[];
  ctaSuggestion: string;
  trendingStructure: string; // e.g., "Hook → Problem → Solution → CTA"
}

export function buildResearchMessages(context: IntakeOutput["normalizedContext"]): LLMMessage[] {
  return [
    {
      role: "system",
      content: `Bạn là chuyên gia nghiên cứu nội dung viral TikTok/Facebook Reels thị trường Việt Nam.
Bạn am hiểu tâm lý người tiêu dùng Việt và các xu hướng video ngắn 2024-2025.
Nhiệm vụ: tìm góc độ nội dung tốt nhất và hook mạnh nhất cho video KOL.
Luôn trả về JSON hợp lệ.`,
    },
    {
      role: "user",
      content: `Dựa vào thông tin sản phẩm sau, hãy tạo hook và chiến lược nội dung:

Sản phẩm: ${context.productName}
Mô tả: ${context.productDescription}
Giá: ${context.price}
Khuyến mãi: ${context.promotion}
Khách hàng mục tiêu: ${context.targetCustomer}
Điểm bán: ${context.sellingPoints.join(", ")}
Nền tảng: ${context.platform}
Loại video: ${context.recommendedVideoType}

Trả về JSON:
{
  "hooks": [
    {
      "text": string,         // hook bằng tiếng Việt, <15 từ, gây tò mò hoặc shock
      "type": "problem" | "curiosity" | "shocking" | "benefit" | "social_proof",
      "score": number         // 1-10 (10 = viral nhất)
    }
  ],
  "bestHookIndex": number,    // index của hook tốt nhất
  "contentAngle": string,     // góc tiếp cận nội dung (ví dụ: "trải nghiệm cá nhân", "so sánh giá", "giải quyết nỗi đau")
  "emotionalTrigger": string, // cảm xúc chính cần khai thác
  "painPoints": string[],     // 3-5 nỗi đau của khách hàng mục tiêu
  "ctaSuggestion": string,    // CTA mạnh, phù hợp thị trường Việt
  "trendingStructure": string // cấu trúc video đang viral nhất cho loại này
}

Yêu cầu:
- Hook phải bằng tiếng Việt, tự nhiên, không sáo rỗng
- Phù hợp tâm lý người dùng TikTok/Facebook Việt Nam
- Tập trung vào cảm xúc và lợi ích thực tế`,
    },
  ];
}
