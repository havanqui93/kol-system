import { describe, expect, it } from "vitest";
import { getPlatformLimits, validateDuration, validateHashtags, PLATFORM_LIMITS } from "../platform-limits";

describe("getPlatformLimits", () => {
  it("returns limits for known platforms", () => {
    const limits = getPlatformLimits("tiktok");
    expect(limits.maxDurationSeconds).toBe(60);
    expect(limits.aspectRatio).toBe("9:16");
    expect(limits.tips.length).toBeGreaterThan(0);
  });

  it("falls back to TikTok limits for unknown platform", () => {
    const limits = getPlatformLimits("unknown_platform");
    expect(limits.maxDurationSeconds).toBe(60);
  });
});

describe("validateDuration", () => {
  it("returns null for valid duration", () => {
    expect(validateDuration("tiktok", 30)).toBeNull();
    expect(validateDuration("tiktok", 60)).toBeNull();
  });

  it("returns error for over-limit duration", () => {
    const err = validateDuration("tiktok", 90);
    expect(err).toContain("60s");
    expect(err).toContain("90s");
  });

  it("returns error for under-minimum duration", () => {
    const err = validateDuration("tiktok", 1);
    expect(err).not.toBeNull();
  });
});

describe("validateHashtags", () => {
  it("returns null for valid count", () => {
    expect(validateHashtags("tiktok", 20)).toBeNull();
    expect(validateHashtags("tiktok", 30)).toBeNull();
  });

  it("returns error for over-limit count", () => {
    const err = validateHashtags("youtube_shorts", 20);
    expect(err).toContain("15");
  });
});

describe("PLATFORM_LIMITS", () => {
  it("has all required platforms", () => {
    expect(PLATFORM_LIMITS.tiktok).toBeDefined();
    expect(PLATFORM_LIMITS.facebook).toBeDefined();
    expect(PLATFORM_LIMITS.instagram).toBeDefined();
    expect(PLATFORM_LIMITS.youtube_shorts).toBeDefined();
  });

  it("all platforms have 9:16 aspect ratio", () => {
    for (const limits of Object.values(PLATFORM_LIMITS)) {
      expect(limits.aspectRatio).toBe("9:16");
    }
  });
});
