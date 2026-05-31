import { describe, expect, it } from "vitest";
import { formatVnd, formatUsd, formatBytes, formatSeconds } from "../format";

describe("Currency formatters", () => {
  describe("VND formatting", () => {
    it("handles zero", () => {
      const result = formatVnd(0);
      expect(result).toContain("0");
    });

    it("handles large amounts", () => {
      const result = formatVnd(10_000_000);
      expect(result).toContain("10");
    });

    it("handles string input", () => {
      const result = formatVnd("250000");
      expect(result).toContain("250");
    });

    it("handles NaN string gracefully", () => {
      expect(formatVnd("not-a-number")).toBe("—");
    });
  });

  describe("USD formatting", () => {
    it("shows correct decimal places", () => {
      expect(formatUsd(0.1234, 2)).toBe("$0.12");
      expect(formatUsd(1.5, 2)).toBe("$1.50");
    });

    it("handles zero", () => {
      expect(formatUsd(0)).toBe("$0.0000");
    });
  });

  describe("File size formatting", () => {
    it("formats GB correctly", () => {
      const result = formatBytes(1024 * 1024 * 1024);
      expect(result).toContain("1.0 GB");
    });

    it("handles bigint input", () => {
      const result = formatBytes(BigInt(1024));
      expect(result).toBe("1.0 KB");
    });
  });

  describe("Seconds formatting", () => {
    it("formats whole minutes", () => {
      expect(formatSeconds(60)).toBe("1m");
      expect(formatSeconds(120)).toBe("2m");
    });

    it("formats minutes with seconds", () => {
      expect(formatSeconds(75)).toBe("1:15");
    });

    it("formats under a minute", () => {
      expect(formatSeconds(45)).toBe("45s");
    });
  });
});
