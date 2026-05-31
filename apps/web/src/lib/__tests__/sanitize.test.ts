import { describe, expect, it } from "vitest";
import { escapeHtml, sanitizeText, sanitizeObject } from "../sanitize";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;"
    );
    expect(escapeHtml("Hello & World")).toBe("Hello &amp; World");
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
  });

  it("leaves safe strings unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });
});

describe("sanitizeText", () => {
  it("trims whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("truncates to maxLength", () => {
    const long = "a".repeat(3000);
    expect(sanitizeText(long)).toHaveLength(2000);
    expect(sanitizeText(long, 100)).toHaveLength(100);
  });

  it("removes control characters", () => {
    expect(sanitizeText("hello\x00world")).toBe("helloworld");
    expect(sanitizeText("hello\x07bell")).toBe("hellobell");
  });

  it("preserves valid Unicode", () => {
    expect(sanitizeText("Xin chào thế giới")).toBe("Xin chào thế giới");
    expect(sanitizeText("Tết Nguyên Đán 🎉")).toBe("Tết Nguyên Đán 🎉");
  });
});

describe("sanitizeObject", () => {
  it("sanitizes string values in object", () => {
    const result = sanitizeObject({ name: "  Hello  ", count: 5 });
    expect(result.name).toBe("Hello");
    expect(result.count).toBe(5);
  });

  it("preserves non-string values", () => {
    const result = sanitizeObject({ a: true, b: null, c: [1, 2] });
    expect(result.a).toBe(true);
    expect(result.b).toBe(null);
    expect(result.c).toEqual([1, 2]);
  });
});
