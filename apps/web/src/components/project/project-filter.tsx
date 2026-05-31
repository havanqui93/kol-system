"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "draft", label: "Bản nháp" },
  { value: "script_ready", label: "Script sẵn sàng" },
  { value: "rendering", label: "Đang render" },
  { value: "ready_to_publish", label: "Sẵn sàng đăng" },
  { value: "published", label: "Đã đăng" },
  { value: "failed", label: "Thất bại" },
];

const PLATFORM_OPTIONS = [
  { value: "", label: "Mọi nền tảng" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
];

export function ProjectFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className={`flex flex-wrap gap-3 items-center ${isPending ? "opacity-60" : ""}`}>
      {/* Search input */}
      <input
        type="search"
        placeholder="Tìm kiếm video..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => updateFilter("q", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-52"
      />

      {/* Status filter */}
      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {/* Platform filter */}
      <select
        value={searchParams.get("platform") ?? ""}
        onChange={(e) => updateFilter("platform", e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
      >
        {PLATFORM_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {isPending && (
        <span className="text-xs text-gray-400 animate-pulse">Đang lọc...</span>
      )}
    </div>
  );
}
