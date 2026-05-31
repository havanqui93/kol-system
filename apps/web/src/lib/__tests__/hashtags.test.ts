import { describe, expect, it } from "vitest";
import { suggestHashtags, countAvailableTags, PLATFORM_TAGS, BASE_VI_TAGS } from "../hashtags";

describe("suggestHashtags", () => {
  it("returns platform-specific tags", () => {
    const tags = suggestHashtags({ platform: "tiktok", videoType: "product_review" });
    expect(tags.some((t) => t.includes("tiktok") || t.includes("fyp"))).toBe(true);
  });

  it("includes base Vietnamese tags", () => {
    const tags = suggestHashtags({ platform: "tiktok", videoType: "product_review" });
    expect(tags.some((t) => BASE_VI_TAGS.includes(t))).toBe(true);
  });

  it("adds category-specific tags", () => {
    const tags = suggestHashtags({ platform: "tiktok", videoType: "product_review", category: "beauty" });
    expect(tags.some((t) => t.includes("skincare") || t.includes("lamdep"))).toBe(true);
  });

  it("respects maxTags limit", () => {
    const tags = suggestHashtags({ platform: "tiktok", videoType: "product_review", maxTags: 5 });
    expect(tags.length).toBeLessThanOrEqual(5);
  });

  it("includes car tags for used_car video type", () => {
    const tags = suggestHashtags({ platform: "tiktok", videoType: "used_car" });
    expect(tags.some((t) => t.includes("xecu") || t.includes("car"))).toBe(true);
  });

  it("includes affiliate tag for affiliate type", () => {
    const tags = suggestHashtags({ platform: "tiktok", videoType: "affiliate" });
    expect(tags.includes("#affiliate")).toBe(true);
  });

  it("adds seasonal tags when provided", () => {
    const tags = suggestHashtags({ platform: "tiktok", videoType: "product_review", seasonal: "tet" });
    expect(tags.some((t) => t.includes("tet"))).toBe(true);
  });

  it("returns unique tags only", () => {
    const tags = suggestHashtags({ platform: "tiktok", videoType: "product_review" });
    const unique = [...new Set(tags)];
    expect(tags.length).toBe(unique.length);
  });
});

describe("countAvailableTags", () => {
  it("returns a positive count", () => {
    expect(countAvailableTags("tiktok")).toBeGreaterThan(0);
    expect(countAvailableTags("facebook")).toBeGreaterThan(0);
  });
});

describe("PLATFORM_TAGS", () => {
  it("has entries for all platforms", () => {
    expect(PLATFORM_TAGS.tiktok).toBeDefined();
    expect(PLATFORM_TAGS.facebook).toBeDefined();
    expect(PLATFORM_TAGS.instagram).toBeDefined();
    expect(PLATFORM_TAGS.youtube_shorts).toBeDefined();
  });
});
