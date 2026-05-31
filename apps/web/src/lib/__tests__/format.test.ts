import { describe, expect, it } from "vitest";
import {
  formatVnd,
  formatUsd,
  formatBytes,
  formatDuration,
  formatSeconds,
  formatRelativeTime,
  formatNumber,
  formatPercent,
  truncate,
  readingTimeMinutes,
  estimatedVideoDuration,
} from "../format";

describe("formatVnd", () => {
  it("formats Vietnamese dong amounts", () => {
    const result = formatVnd(100000);
    expect(result).toContain("100");
    expect(result).toContain("đ");
  });

  it("returns — for null", () => {
    expect(formatVnd(null)).toBe("—");
    expect(formatVnd(undefined)).toBe("—");
  });

  it("handles string input", () => {
    const result = formatVnd("50000");
    expect(result).toContain("50");
  });
});

describe("formatUsd", () => {
  it("formats USD with $ prefix", () => {
    expect(formatUsd(1.5)).toBe("$1.5000");
    expect(formatUsd(0.001234, 4)).toBe("$0.0012");
  });

  it("returns — for null", () => {
    expect(formatUsd(null)).toBe("—");
    expect(formatUsd(undefined)).toBe("—");
  });
});

describe("formatBytes", () => {
  it("formats byte sizes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(0)).toBe("0 B");
  });

  it("returns — for null", () => {
    expect(formatBytes(null)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("formats milliseconds", () => {
    expect(formatDuration(500)).toBe("500ms");
    expect(formatDuration(1500)).toBe("1.5s");
    expect(formatDuration(90000)).toBe("1m 30s");
  });

  it("returns — for null", () => {
    expect(formatDuration(null)).toBe("—");
  });
});

describe("formatSeconds", () => {
  it("formats seconds", () => {
    expect(formatSeconds(30)).toBe("30s");
    expect(formatSeconds(90)).toBe("1:30");
    expect(formatSeconds(120)).toBe("2m");
  });
});

describe("formatRelativeTime", () => {
  it("shows 'vừa xong' for recent times", () => {
    expect(formatRelativeTime(new Date())).toBe("vừa xong");
  });

  it("returns — for null", () => {
    expect(formatRelativeTime(null)).toBe("—");
  });
});

describe("formatNumber", () => {
  it("formats numbers with Vietnamese locale", () => {
    const result = formatNumber(1000);
    expect(result).toContain("1");
    expect(result).toContain("000");
  });
});

describe("formatPercent", () => {
  it("formats percentages", () => {
    expect(formatPercent(75.5)).toBe("75.5%");
    expect(formatPercent(100)).toBe("100.0%");
  });

  it("returns — for null", () => {
    expect(formatPercent(null)).toBe("—");
  });
});

describe("truncate", () => {
  it("truncates long strings", () => {
    expect(truncate("Hello World", 8)).toBe("Hello...");
    expect(truncate("Hi", 10)).toBe("Hi");
  });
});

describe("readingTimeMinutes", () => {
  it("estimates reading time at 150 wpm", () => {
    expect(readingTimeMinutes(150)).toBe(1);
    expect(readingTimeMinutes(300)).toBe(2);
  });

  it("returns minimum 1 minute", () => {
    expect(readingTimeMinutes(10)).toBe(1);
  });
});

describe("estimatedVideoDuration", () => {
  it("estimates video duration at 130 wpm", () => {
    expect(estimatedVideoDuration(130)).toBe(60); // 130 words ≈ 60s
    expect(estimatedVideoDuration(65)).toBe(30);  // 65 words ≈ 30s
  });
});
