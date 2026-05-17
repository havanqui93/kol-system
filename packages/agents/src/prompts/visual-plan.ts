import type { LLMMessage } from "@kol/providers";
import type { ScriptOutput } from "./script.js";

export type VisualType =
  | "talking_head"
  | "product_motion"
  | "product_broll"
  | "text_overlay"
  | "before_after"
  | "price_highlight"
  | "cta_screen";

export interface VisualScene {
  sceneIndex: number;
  label: string;
  durationSeconds: number;
  visualType: VisualType;
  tool: "kling" | "remotion" | "ffmpeg_still";
  klingPrompt?: string;
  negativePrompt?: string;
  remotionTemplate?: string;
  audioSegment: string;
  cameraMovement?: string;
  notes?: string;
}

export interface VisualPlanOutput {
  scenes: VisualScene[];
  totalKlingSeconds: number;  // cost estimation
  productImageNeeded: boolean;
  kolAvatarNeeded: boolean;
}

export function buildVisualPlanMessages(
  script: ScriptOutput,
  context: { productName: string; platform: string; videoType: string; hasKolAvatar: boolean; hasProductImage: boolean }
): LLMMessage[] {
  return [
    {
      role: "system",
      content: `Bạn là director video chuyên lên kế hoạch cảnh quay cho video KOL ngắn.
Nguyên tắc chi phí: Dùng Kling tối đa 10-15 giây. Phần còn lại dùng Remotion/FFmpeg (ảnh tĩnh + motion effect).
Kling chỉ dùng cho: talking head KOL, product animation đặc sắc, hook clip mạnh.
Luôn trả về JSON hợp lệ.`,
    },
    {
      role: "user",
      content: `Lên kế hoạch cảnh quay cho video KOL:

Nền tảng: ${context.platform}
Loại video: ${context.videoType}
Sản phẩm: ${context.productName}
Có ảnh KOL avatar: ${context.hasKolAvatar}
Có ảnh sản phẩm: ${context.hasProductImage}

Script theo cảnh:
${script.scenes.map((s, i) => `${i + 1}. [${s.label}] (${s.durationSeconds}s): "${s.text}"`).join("\n")}

Trả về JSON:
{
  "scenes": [
    {
      "sceneIndex": number,
      "label": string,
      "durationSeconds": number,
      "visualType": "talking_head" | "product_motion" | "product_broll" | "text_overlay" | "before_after" | "price_highlight" | "cta_screen",
      "tool": "kling" | "remotion" | "ffmpeg_still",
      "klingPrompt": string | null,       // prompt tiếng Anh cho Kling (nếu dùng Kling)
      "negativePrompt": string | null,
      "remotionTemplate": string | null,  // tên template Remotion (nếu dùng Remotion)
      "audioSegment": string,             // đoạn audio tương ứng
      "cameraMovement": string | null,    // static | zoom_in | zoom_out | pan_left | pan_right
      "notes": string | null
    }
  ],
  "totalKlingSeconds": number,
  "productImageNeeded": boolean,
  "kolAvatarNeeded": boolean
}

Ưu tiên:
- Hook: dùng Kling (5s) nếu có KOL avatar
- Cảnh sản phẩm đặc sắc: Kling image-to-video (5s)
- Text/giá/CTA: Remotion
- B-roll bình thường: ffmpeg_still (ảnh + Ken Burns effect)`,
    },
  ];
}
