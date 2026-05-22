"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const RECENT_KEY = "kol-recent-projects";
const MAX_RECENT = 3;

interface RecentProject {
  id: string;
  title: string;
  status: string;
  visitedAt: number;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function statusColor(status: string) {
  if (status === "failed") return "bg-red-100 text-red-600";
  if (status === "published" || status === "ready_to_publish") return "bg-green-100 text-green-700";
  if (status === "script_ready") return "bg-orange-100 text-orange-700";
  return "bg-gray-100 text-gray-500";
}

export function trackVisited(project: { id: string; title: string; status: string }) {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    const prev: RecentProject[] = saved ? JSON.parse(saved) : [];
    const entry: RecentProject = { id: project.id, title: project.title, status: project.status, visitedAt: Date.now() };
    const next = [entry, ...prev.filter((p) => p.id !== project.id)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    // Keep old key in sync for backwards compat
    localStorage.setItem("kol-last-visited", JSON.stringify(entry));
  } catch {}
}

export function LastVisitedBanner() {
  const [recent, setRecent] = useState<RecentProject[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) { setRecent(JSON.parse(saved)); return; }
      // Migrate from old single-item key
      const old = localStorage.getItem("kol-last-visited");
      if (old) setRecent([JSON.parse(old)]);
    } catch {}
  }, []);

  if (recent.length === 0) return null;

  return (
    <div className="mb-6 bg-brand-50 border border-brand-100 rounded-xl px-5 py-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">↩ Gần đây</span>
        <button
          onClick={() => { localStorage.removeItem(RECENT_KEY); localStorage.removeItem("kol-last-visited"); setRecent([]); }}
          aria-label="Xóa lịch sử"
          className="text-brand-300 hover:text-brand-500 transition-colors text-sm leading-none"
        >
          ×
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recent.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="flex items-center gap-1.5 bg-white border border-brand-100 hover:border-brand-300 rounded-lg px-3 py-1.5 transition-colors min-w-0"
          >
            <span className="text-brand-700 font-medium truncate max-w-[12rem]">{p.title}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusColor(p.status)}`}>
              {p.status.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] text-brand-300 flex-shrink-0">{timeAgo(p.visitedAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
