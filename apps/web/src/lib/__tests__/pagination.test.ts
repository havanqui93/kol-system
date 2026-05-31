import { describe, expect, it } from "vitest";
import { buildPageMeta, parsePage, parsePageSize, buildCursorPage } from "../pagination";

describe("buildPageMeta", () => {
  it("computes correct metadata", () => {
    const meta = buildPageMeta({ page: 2, pageSize: 10, total: 95 });
    expect(meta.totalPages).toBe(10);
    expect(meta.hasPrev).toBe(true);
    expect(meta.hasNext).toBe(true);
    expect(meta.from).toBe(11);
    expect(meta.to).toBe(20);
  });

  it("handles last page correctly", () => {
    const meta = buildPageMeta({ page: 10, pageSize: 10, total: 95 });
    expect(meta.hasNext).toBe(false);
    expect(meta.to).toBe(95);
  });

  it("handles first page of 1", () => {
    const meta = buildPageMeta({ page: 1, pageSize: 20, total: 5 });
    expect(meta.hasPrev).toBe(false);
    expect(meta.hasNext).toBe(false);
    expect(meta.totalPages).toBe(1);
  });

  it("handles empty results", () => {
    const meta = buildPageMeta({ page: 1, pageSize: 20, total: 0 });
    expect(meta.totalPages).toBe(0);
    expect(meta.from).toBe(0);
    expect(meta.to).toBe(0);
  });
});

describe("parsePage", () => {
  it("returns default for invalid input", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-1")).toBe(1);
  });

  it("parses valid page numbers", () => {
    expect(parsePage("1")).toBe(1);
    expect(parsePage("5")).toBe(5);
  });
});

describe("parsePageSize", () => {
  it("respects max limit", () => {
    expect(parsePageSize("200", 20, 100)).toBe(100);
  });

  it("returns default for invalid", () => {
    expect(parsePageSize(undefined, 20)).toBe(20);
    expect(parsePageSize("0", 20)).toBe(20);
  });
});

describe("buildCursorPage", () => {
  const items = Array.from({ length: 5 }, (_, i) => ({ id: `id-${i}` }));

  it("detects hasMore correctly", () => {
    const result = buildCursorPage(items, 4);
    expect(result.hasMore).toBe(true);
    expect(result.items.length).toBe(4);
    expect(result.nextCursor).toBe("id-3");
  });

  it("returns all items when under limit", () => {
    const result = buildCursorPage(items, 10);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
    expect(result.items.length).toBe(5);
  });
});
