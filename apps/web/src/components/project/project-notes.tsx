"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = (id: string) => `kol-notes-${id}`;

export function ProjectNotes({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(projectId)) ?? "";
    setNotes(stored);
  }, [projectId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNotes(e.target.value);
    setSaved(false);
    localStorage.setItem(STORAGE_KEY(projectId), e.target.value);
    setSaved(true);
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor="project-notes" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Ghi chú cá nhân
        </label>
        {saved && notes && <span className="text-xs text-gray-400">Lưu tự động ✓</span>}
      </div>
      <textarea
        id="project-notes"
        value={notes}
        onChange={handleChange}
        placeholder="Ghi chú, ý tưởng, phản hồi khách hàng..."
        rows={3}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder-gray-300"
      />
      <p className="text-xs text-gray-400 mt-0.5">Lưu trữ cục bộ trên trình duyệt</p>
    </div>
  );
}
