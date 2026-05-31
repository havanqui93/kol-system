// Brand color utilities for KOL video overlays

export const PRESET_BRAND_COLORS = [
  { name: "Tím thương hiệu", hex: "#7c3aed" },
  { name: "Đỏ năng động", hex: "#dc2626" },
  { name: "Cam TikTok", hex: "#ff6550" },
  { name: "Xanh chuyên nghiệp", hex: "#2563eb" },
  { name: "Xanh lá tự nhiên", hex: "#16a34a" },
  { name: "Hồng thời trang", hex: "#db2777" },
  { name: "Đen sang trọng", hex: "#111827" },
  { name: "Vàng cao cấp", hex: "#d97706" },
];

export function isValidHexColor(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function getContrastColor(hex: string): "#000000" | "#ffffff" {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";
  // Relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
