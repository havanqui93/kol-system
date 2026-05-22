"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { ProjectCard } from "@/components/project/project-card";
import { ExportCSVButton } from "@/components/project/export-csv";
import type { Project } from "@/lib/api/client";

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "draft", label: "Nháp" },
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

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "status", label: "Theo trạng thái" },
];

function sortProjects(projects: Project[], sort: string) {
  const copy = [...projects];
  if (sort === "oldest") return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (sort === "status") return copy.sort((a, b) => a.status.localeCompare(b.status));
  return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function ProjectFilter({ initialProjects, initialStatus = "" }: { initialProjects: Project[]; initialStatus?: string }) {
  const [projects, setProjects] = useState(initialProjects);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sort, setSort] = useState("newest");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchInput), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  const focusSearch = useCallback(() => { searchInputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        focusSearch();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusSearch]);

  const filtered = useMemo(
    () => sortProjects(
      projects.filter((p) => matchesStatus(p, statusFilter) && matchesSearch(p, search)),
      sort
    ),
    [projects, search, statusFilter, sort]
  );

  function handleDeleted(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div>
      {/* Search + filter bar */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-40 relative">
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Tìm theo tên, sản phẩm, nền tảng... (nhấn / để tìm)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Xóa tìm kiếm"
            >
              ×
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Active filter chips */}
      {(searchInput || statusFilter) && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs text-gray-400">Đang lọc:</span>
          {searchInput && (
            <span className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-2.5 py-0.5">
              "{searchInput}"
              <button onClick={() => setSearchInput("")} className="hover:text-brand-900 leading-none">×</button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 border border-gray-200 rounded-full px-2.5 py-0.5">
              {STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter}
              <button onClick={() => setStatusFilter("")} className="hover:text-gray-900 leading-none">×</button>
            </span>
          )}
          <button
            onClick={() => { setSearchInput(""); setStatusFilter(""); setSort("newest"); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Xóa tất cả
          </button>
        </div>
      )}

      {/* Result count + reset + CSV export */}
      <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span>
            {filtered.length < projects.length
              ? `${filtered.length} / ${projects.length} dự án`
              : `${projects.length} dự án`}
          </span>
          {filtered.length > 0 && (
            <span>
              · {Math.floor(filtered.reduce((sum, p) => sum + p.durationSeconds, 0) / 60)}m{filtered.reduce((sum, p) => sum + p.durationSeconds, 0) % 60}s tổng
            </span>
          )}
        </div>
        {filtered.length > 0 && <ExportCSVButton projects={filtered} />}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-12">
          {searchInput || statusFilter ? "Không tìm thấy dự án phù hợp" : "Chưa có video nào"}
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
