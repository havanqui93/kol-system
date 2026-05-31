// Platform-specific content limits and guidelines for Vietnamese social media

export interface PlatformLimits {
  maxDurationSeconds: number;
  minDurationSeconds: number;
  maxTitleChars: number;
  maxDescriptionChars: number;
  maxHashtags: number;
  aspectRatio: string;
  recommendedDurations: number[];
  tips: string[];
}

export const PLATFORM_LIMITS: Record<string, PlatformLimits> = {
  tiktok: {
    maxDurationSeconds: 60,
    minDurationSeconds: 5,
    maxTitleChars: 150,
    maxDescriptionChars: 2200,
    maxHashtags: 30,
    aspectRatio: "9:16",
    recommendedDurations: [15, 30, 45, 60],
    tips: [
      "Hook mạnh trong 3 giây đầu",
      "Caption ngắn gọn, dễ đọc",
      "Dùng trending sounds để tăng reach",
      "Đăng vào 6-9 giờ tối để tăng view",
      "Tối đa 5 hashtag hiệu quả nhất",
    ],
  },
  facebook: {
    maxDurationSeconds: 240,
    minDurationSeconds: 3,
    maxTitleChars: 500,
    maxDescriptionChars: 63206,
    maxHashtags: 30,
    aspectRatio: "9:16",
    recommendedDurations: [30, 60, 90],
    tips: [
      "Video ngắn dưới 60 giây có tỷ lệ xem hoàn chỉnh cao hơn",
      "Caption dài hơn TikTok, có thể kể câu chuyện",
      "Tag sản phẩm trực tiếp trong video",
      "Đăng vào 12-3 giờ chiều ngày làm việc",
    ],
  },
  instagram: {
    maxDurationSeconds: 90,
    minDurationSeconds: 3,
    maxTitleChars: 2200,
    maxDescriptionChars: 2200,
    maxHashtags: 30,
    aspectRatio: "9:16",
    recommendedDurations: [15, 30, 60],
    tips: [
      "Dùng đúng 3-5 hashtag có lượng tìm kiếm cao",
      "Thumbnail hấp dẫn để tăng CTR",
      "Stories + Reels kết hợp tốt hơn",
      "Đăng lúc 11 giờ sáng hoặc 7 giờ tối",
    ],
  },
  youtube_shorts: {
    maxDurationSeconds: 60,
    minDurationSeconds: 1,
    maxTitleChars: 100,
    maxDescriptionChars: 5000,
    maxHashtags: 15,
    aspectRatio: "9:16",
    recommendedDurations: [30, 45, 60],
    tips: [
      "Tiêu đề phải có keyword",
      "Thumbnail tự động — chọn frame đẹp nhất",
      "Phụ đề giúp tăng accessibility và SEO",
      "Đăng đều đặn để tăng subscribers",
      "Subscribe button xuất hiện tự động ở cuối",
    ],
  },
};

export function getPlatformLimits(platform: string): PlatformLimits {
  return PLATFORM_LIMITS[platform] ?? PLATFORM_LIMITS.tiktok;
}

export function validateDuration(platform: string, durationSeconds: number): string | null {
  const limits = getPlatformLimits(platform);
  if (durationSeconds > limits.maxDurationSeconds) {
    return `${platform} cho phép tối đa ${limits.maxDurationSeconds}s (video của bạn: ${durationSeconds}s)`;
  }
  if (durationSeconds < limits.minDurationSeconds) {
    return `${platform} yêu cầu tối thiểu ${limits.minDurationSeconds}s`;
  }
  return null;
}

export function validateHashtags(platform: string, count: number): string | null {
  const limits = getPlatformLimits(platform);
  if (count > limits.maxHashtags) {
    return `${platform} cho phép tối đa ${limits.maxHashtags} hashtag`;
  }
  return null;
}
