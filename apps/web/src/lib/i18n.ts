// UI string constants — centralised for future i18n replacement
// Replace this object with i18next or next-intl when adding multi-language support

export const STRINGS = {
  // Status labels
  status: {
    draft: "Bản nháp",
    script_generating: "Đang tạo kịch bản",
    script_ready: "Kịch bản sẵn sàng",
    script_approved: "Kịch bản đã duyệt",
    audio_generating: "Đang tạo giọng nói",
    audio_ready: "Giọng nói sẵn sàng",
    video_generating: "Đang tạo clip",
    clips_ready: "Clip sẵn sàng",
    rendering: "Đang render",
    rendered: "Đã render",
    qa_checking: "Đang kiểm tra",
    ready_to_publish: "Sẵn sàng đăng",
    publishing: "Đang đăng",
    published: "Đã đăng",
    failed: "Thất bại",
  } as Record<string, string>,

  // Platform labels
  platform: {
    tiktok: "TikTok",
    facebook: "Facebook Reels",
    instagram: "Instagram Reels",
    youtube_shorts: "YouTube Shorts",
  } as Record<string, string>,

  // Video type labels
  videoType: {
    product_review: "Review sản phẩm",
    affiliate: "Affiliate",
    used_car: "Ô tô cũ",
    virtual_kol: "KOL ảo",
    b_roll: "B-roll",
  } as Record<string, string>,

  // Quality presets
  quality: {
    cheap: "Tiết kiệm",
    balanced: "Cân bằng",
    premium: "Premium",
  } as Record<string, string>,

  // Common actions
  action: {
    save: "Lưu",
    cancel: "Hủy",
    delete: "Xóa",
    confirm: "Xác nhận",
    retry: "Thử lại",
    refresh: "Làm mới",
    back: "Quay lại",
    create: "Tạo",
    edit: "Sửa",
    duplicate: "Nhân bản",
    archive: "Lưu trữ",
    restore: "Khôi phục",
  } as Record<string, string>,

  // Common messages
  msg: {
    loading: "Đang tải...",
    saving: "Đang lưu...",
    saved: "Đã lưu",
    error: "Đã xảy ra lỗi",
    notFound: "Không tìm thấy",
    noData: "Chưa có dữ liệu",
    success: "Thành công",
  } as Record<string, string>,
} as const;

export type StatusKey = keyof typeof STRINGS.status;
export type PlatformKey = keyof typeof STRINGS.platform;

export function getStatusLabel(status: string): string {
  return STRINGS.status[status] ?? status;
}

export function getPlatformLabel(platform: string): string {
  return STRINGS.platform[platform] ?? platform;
}

export function getVideoTypeLabel(videoType: string): string {
  return STRINGS.videoType[videoType] ?? videoType;
}
