"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LastVisited {
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

export function LastVisitedBanner() {
  const [last, setLast] = useState<LastVisited | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kol-last-visited");
      if (saved) setLast(JSON.parse(saved));
    } catch {}
  }, []);

  if (!last) return null;

  return (
    <div className="mb-6 flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-xl px-5 py-3 text-sm">
      <span className="text-brand-400 text-base flex-shrink-0">↩</span>
      <div className="flex-1 min-w-0">
        <span className="text-brand-700 font-medium">Tiếp tục: </span>
        <Link href={`/projects/${last.id}`} className="text-brand-600 hover:underline font-medium">
          {last.title}
        </Link>
        <span className="text-brand-400 ml-2 text-xs">{timeAgo(last.visitedAt)}</span>
      </div>
      <button
        onClick={() => { localStorage.removeItem("kol-last-visited"); setLast(null); }}
        aria-label="Ẩn banner"
        className="text-brand-300 hover:text-brand-500 transition-colors text-lg leading-none flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}
