import type { LLMMessage } from "@kol/providers";

export interface PublisherMetaInput {
  productName: string;
  fullScript: string;
  platform: "tiktok" | "facebook" | "instagram" | "youtube_shorts";
  language: string;
  targetCustomer: string;
}

export interface PublisherMetaOutput {
  title: string;
  description: string;
  hashtags: string[];
  firstComment?: string; // pinned comment strategy
}

export function buildPublisherMetaMessages(input: PublisherMetaInput): LLMMessage[] {
  const platformGuide: Record<string, string> = {
    tiktok: "TikTok: tiêu đề <100 ký tự, 3-5 hashtag trending, caption ngắn gọn kêu gọi xem video",
    facebook: "Facebook Reels: tiêu đề hấp dẫn, mô tả 2-3 câu, 5-10 hashtag mix tiếng Việt và tiếng Anh",
    instagram: "Instagram Reels: caption 150 ký tự + call to action, 10-15 hashtag, emoji phù hợp",
    youtube_shorts: "YouTube Shorts: tiêu đề SEO-friendly <100 ký tự, mô tả có keyword, 3-5 hashtag",
  };

  return [
    {
      role: "system",
      content: `Bạn là chuyên gia social media marketing cho thị trường Việt Nam.
Tạo caption, hashtag và metadata tối ưu cho từng nền tảng.
Ngôn ngữ: Tiếng Việt tự nhiên, phù hợp từng nền tảng.
Luôn trả về JSON hợp lệ.`,
    },
    {
      role: "user",
      content: `Tạo metadata đăng bài cho video KOL:

Sản phẩm: ${input.productName}
Script: "${input.fullScript.slice(0, 500)}..."
Nền tảng: ${input.platform}
Đối tượng: ${input.targetCustomer}

Hướng dẫn: ${platformGuide[input.platform]}

Trả về JSON:
{
  "title": string,
  "description": string,
  "hashtags": string[],     // không có dấu #, ví dụ: ["review", "muasam"]
  "firstComment": string    // comment ghim chiến lược (nếu phù hợp)
}

Hashtag phải mix: brand hashtag + trending hashtag + niche hashtag + product hashtag.
Ưu tiên hashtag tiếng Việt có lượt dùng cao.`,
    },
  ];
}
