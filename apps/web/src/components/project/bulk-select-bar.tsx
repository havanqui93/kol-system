"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/project/project-card";
import type { Project } from "@/lib/api/client";

interface ProjectListWithSelectProps {
  projects: Project[];
}

export function ProjectListWithSelect({ projects }: ProjectListWithSelectProps) {
  const router = useRouter();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() { setSelected(new Set(projects.map((p) => p.id))); }
  function clearAll() { setSelected(new Set()); }

  async function bulkArchive() {
    if (!selected.size) return;
    setWorking(true);
    try {
      await fetch("/api/video-projects/bulk-archive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), archive: true }),
      });
      setSelected(new Set());
      setSelectMode(false);
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  async function bulkDelete() {
    if (!selected.size) return;
    if (!confirm(`Xoá vĩnh viễn ${selected.size} project? Hành động này không thể hoàn tác.`)) return;
    setWorking(true);
    try {
      await fetch("/api/video-projects/bulk-delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setSelectMode(false);
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  return (
    <div>
      {/* Mode toggle + toolbar */}
      <div className="flex items-center gap-2 mb-3">
        {!selectMode ? (
          <button
            onClick={() => setSelectMode(true)}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors ml-auto"
          >
            ☐ Chọn nhiều
          </button>
        ) : (
          <div className="flex items-center gap-3 w-full bg-white border border-brand-200 rounded-xl px-4 py-2 shadow-sm">
            <span className="text-sm font-medium text-gray-700">
              {selected.size}/{projects.length} đã chọn
            </span>
            <button onClick={selectAll} className="text-xs text-brand-600 hover:underline ml-2">Tất cả</button>
            <button onClick={clearAll} className="text-xs text-gray-500 hover:underline">Bỏ chọn</button>
            <div className="flex-1" />
            <Button
              size="sm"
              disabled={!selected.size || working}
              loading={working}
              onClick={bulkArchive}
            >
              Lưu trữ ({selected.size})
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={!selected.size || working}
              onClick={bulkDelete}
            >
              Xoá
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setSelectMode(false); clearAll(); }}>
              Hủy
            </Button>
          </div>
        )}
      </div>

      {/* Cards with optional checkboxes */}
      <div className="grid gap-3">
        {projects.map((project) => (
          <div key={project.id} className="flex items-start gap-3">
            {selectMode && (
              <div className="mt-4 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={selected.has(project.id)}
                  onChange={() => toggle(project.id)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>
            )}
            <div
              className={`flex-1 min-w-0 transition-opacity ${selectMode ? "cursor-pointer" : ""}`}
              onClick={selectMode ? () => toggle(project.id) : undefined}
            >
              <ProjectCard project={project} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
