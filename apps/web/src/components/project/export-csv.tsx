"use client";

import type { Project } from "@/lib/api/client";

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok", facebook: "Facebook Reels",
  instagram: "Instagram Reels", youtube_shorts: "YouTube Shorts",
};

function toCSV(projects: Project[]): string {
  const headers = [
    "ID", "Tiêu đề", "Nền tảng", "Loại video", "Chất lượng", "Ngôn ngữ",
    "Trạng thái", "Lỗi", "Sản phẩm", "KOL Profile", "Thời lượng (s)",
    "Ngày tạo", "Cập nhật", "URL video",
  ];
  const rows = projects.map((p) => [
    p.id,
    p.title ?? "",
    PLATFORM_LABELS[p.platform] ?? p.platform,
    p.videoType,
    p.qualityPreset,
    p.language.toUpperCase(),
    p.status,
    p.errorMessage ?? "",
    p.product?.name ?? "",
    p.kolProfile?.name ?? "",
    p.durationSeconds,
    new Date(p.createdAt).toLocaleDateString("vi-VN"),
    new Date(p.updatedAt).toLocaleDateString("vi-VN"),
    p.finalVideoUrl ?? "",
  ]);
  return [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function ExportCSVButton({ projects }: { projects: Project[] }) {
  function handleExport() {
    const csv = toCSV(projects);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kol-projects-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      title={`Xuất ${projects.length} dự án ra CSV`}
    >
      ⬇ Xuất CSV ({projects.length})
    </button>
  );
}
