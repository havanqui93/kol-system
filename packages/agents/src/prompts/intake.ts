import type { LLMMessage } from "@kol/providers";

export interface IntakeInput {
  productName?: string;
  productDescription?: string;
  price?: string;
  promotion?: string;
  targetCustomer?: string;
  imageUrls?: string[];
  textIdea?: string;
  kolStyle?: string;
  platform?: string;
  language?: string;
  durationSeconds?: number;
}

export interface IntakeOutput {
  normalizedContext: {
    productName: string;
    productDescription: string;
    price: string;
    promotion: string;
    targetCustomer: string;
    sellingPoints: string[];
    recommendedVideoType: "product_review" | "affiliate" | "used_car" | "virtual_kol" | "b_roll";
    recommendedDuration: 15 | 30 | 45 | 60;
    platform: string;
    language: string;
  };
  missingFields: string[];
  warnings: string[];
}

export function buildIntakeMessages(input: IntakeInput): LLMMessage[] {
  return [
    {
      role: "system",
      content: `Bạn là chuyên gia phân tích nội dung video KOL cho thị trường Việt Nam.
Nhiệm vụ: chuẩn hóa thông tin đầu vào từ người dùng thành context rõ ràng để các agent tiếp theo xử lý.
Ngôn ngữ ưu tiên: Tiếng Việt.
Luôn trả về JSON hợp lệ theo schema được yêu cầu.`,
    },
    {
      role: "user",
      content: `Phân tích thông tin sản phẩm/video sau và chuẩn hóa thành context:

${JSON.stringify(input, null, 2)}

Trả về JSON với schema:
{
  "normalizedContext": {
    "productName": string,
    "productDescription": string,
    "price": string,
    "promotion": string,
    "targetCustomer": string,
    "sellingPoints": string[],       // 3-5 điểm bán hàng mạnh nhất
    "recommendedVideoType": "product_review" | "affiliate" | "used_car" | "virtual_kol" | "b_roll",
    "recommendedDuration": 15 | 30 | 45 | 60,
    "platform": string,
    "language": string
  },
  "missingFields": string[],         // danh sách thông tin còn thiếu
  "warnings": string[]               // cảnh báo nếu có thông tin mâu thuẫn hoặc rủi ro
}`,
    },
  ];
}
