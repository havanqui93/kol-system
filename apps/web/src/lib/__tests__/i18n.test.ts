import { describe, expect, it } from "vitest";
import { getStatusLabel, getPlatformLabel, getVideoTypeLabel, STRINGS } from "../i18n";

describe("getStatusLabel", () => {
  it("returns Vietnamese label for known statuses", () => {
    expect(getStatusLabel("draft")).toBe("Bản nháp");
    expect(getStatusLabel("published")).toBe("Đã đăng");
    expect(getStatusLabel("failed")).toBe("Thất bại");
  });

  it("falls back to the status key for unknown statuses", () => {
    expect(getStatusLabel("unknown_status")).toBe("unknown_status");
  });

  it("covers all pipeline statuses", () => {
    const statuses = [
      "draft", "script_generating", "script_ready", "script_approved",
      "audio_generating", "audio_ready", "video_generating", "clips_ready",
      "rendering", "rendered", "qa_checking", "ready_to_publish",
      "publishing", "published", "failed",
    ];
    for (const s of statuses) {
      expect(getStatusLabel(s)).not.toBe(s); // should have a Vietnamese translation
    }
  });
});

describe("getPlatformLabel", () => {
  it("returns platform display names", () => {
    expect(getPlatformLabel("tiktok")).toBe("TikTok");
    expect(getPlatformLabel("facebook")).toBe("Facebook Reels");
    expect(getPlatformLabel("youtube_shorts")).toBe("YouTube Shorts");
  });

  it("falls back to platform key", () => {
    expect(getPlatformLabel("unknown")).toBe("unknown");
  });
});

describe("getVideoTypeLabel", () => {
  it("returns Vietnamese video type names", () => {
    expect(getVideoTypeLabel("product_review")).toBe("Review sản phẩm");
    expect(getVideoTypeLabel("used_car")).toBe("Ô tô cũ");
  });
});

describe("STRINGS", () => {
  it("has all required string keys", () => {
    expect(STRINGS.action.save).toBeDefined();
    expect(STRINGS.action.cancel).toBeDefined();
    expect(STRINGS.msg.loading).toBeDefined();
    expect(STRINGS.msg.error).toBeDefined();
  });
});
