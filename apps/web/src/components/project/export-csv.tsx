"use client";

import type { Project } from "@/lib/api/client";

function toCSV(projects: Project[]): string {
  const headers = ["ID", "Tiêu đề", "Nền tảng", "Loại video", "Trạng thái", "Sản phẩm", "Thời lượng (s)", "Ngày tạo"];
  const rows = projects.map((p) => [
    p.id,
    p.title ?? "",
    p.platform,
    p.videoType,
    p.status,
    p.product?.name ?? "",
    p.durationSeconds,
    new Date(p.createdAt).toLocaleDateString("vi-VN"),
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
      title="Xuất danh sách CSV"
    >
      ⬇ Xuất CSV
    </button>
  );
}
