"use client";

import { useState, useMemo } from "react";
import { ProjectCard } from "@/components/project/project-card";
import type { Project } from "@/lib/api/client";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "processing", label: "Đang xử lý" },
  { value: "script_ready", label: "Chờ duyệt kịch bản" },
  { value: "ready_to_publish", label: "Sẵn sàng đăng" },
  { value: "published", label: "Đã đăng" },
  { value: "failed", label: "Thất bại" },
];

const PROCESSING_STATUSES = new Set(["script_generating", "audio_generating", "video_generating", "rendering", "qa_checking", "publishing"]);

function matchesStatus(project: Project, filter: string) {
  if (!filter) return true;
  if (filter === "processing") return PROCESSING_STATUSES.has(project.status);
  return project.status === filter;
}

function matchesSearch(project: Project, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    (project.title ?? "").toLowerCase().includes(q) ||
    (project.product?.name ?? "").toLowerCase().includes(q) ||
    project.platform.toLowerCase().includes(q)
  );
}

export function ProjectFilter({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(
    () => projects.filter((p) => matchesStatus(p, statusFilter) && matchesSearch(p, search)),
    [projects, search, statusFilter]
  );

  function handleDeleted(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      {/* Search + filter bar */}
      <div className="flex gap-3 mb-5">
        <input
          type="search"
          placeholder="Tìm theo tên, sản phẩm, nền tảng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-12">
          {search || statusFilter ? "Không tìm thấy dự án phù hợp" : "Chưa có video nào"}
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
