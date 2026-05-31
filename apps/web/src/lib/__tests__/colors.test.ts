import { describe, expect, it } from "vitest";
import { isValidHexColor, hexToRgb, getContrastColor, lighten, PRESET_BRAND_COLORS } from "../colors";

describe("isValidHexColor", () => {
  it("accepts valid 6-digit hex colors", () => {
    expect(isValidHexColor("#7c3aed")).toBe(true);
    expect(isValidHexColor("#000000")).toBe(true);
    expect(isValidHexColor("#FFFFFF")).toBe(true);
  });

  it("rejects invalid hex colors", () => {
    expect(isValidHexColor("7c3aed")).toBe(false);  // missing #
    expect(isValidHexColor("#fff")).toBe(false);      // 3-digit
    expect(isValidHexColor("#xyzxyz")).toBe(false);   // non-hex chars
  });
});

describe("hexToRgb", () => {
  it("converts valid hex to RGB", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#0000ff")).toEqual({ r: 0, g: 0, b: 255 });
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("returns null for invalid hex", () => {
    expect(hexToRgb("invalid")).toBeNull();
  });
});

describe("getContrastColor", () => {
  it("returns black for light backgrounds", () => {
    expect(getContrastColor("#ffffff")).toBe("#000000");
    expect(getContrastColor("#ffff00")).toBe("#000000");
  });

  it("returns white for dark backgrounds", () => {
    expect(getContrastColor("#000000")).toBe("#ffffff");
    expect(getContrastColor("#1a1a2e")).toBe("#ffffff");
  });
});

describe("lighten", () => {
  it("lightens a color", () => {
    const lightened = lighten("#000000", 0.5);
    const rgb = hexToRgb(lightened);
    expect(rgb?.r).toBeGreaterThan(100);
    expect(rgb?.g).toBeGreaterThan(100);
  });
});

describe("PRESET_BRAND_COLORS", () => {
  it("has valid hex colors", () => {
    for (const color of PRESET_BRAND_COLORS) {
      expect(isValidHexColor(color.hex)).toBe(true);
    }
  });

  it("has at least 5 presets", () => {
    expect(PRESET_BRAND_COLORS.length).toBeGreaterThanOrEqual(5);
  });
});
