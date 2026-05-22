"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = (id: string) => `kol-notes-${id}`;
const MAX_CHARS = 2000;

export function ProjectNotes({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(projectId)) ?? "";
    setNotes(stored);
  }, [projectId]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [notes]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value.slice(0, MAX_CHARS);
    setNotes(val);
    setSaved(false);
    localStorage.setItem(STORAGE_KEY(projectId), val);
    setSaved(true);
  }

  function handleDownload() {
    if (!notes) return;
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${projectId.slice(-6)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const remaining = MAX_CHARS - notes.length;
  const nearLimit = remaining < 200;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <label htmlFor="project-notes" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Ghi chú cá nhân
        </label>
        <div className="flex items-center gap-2">
          {saved && notes && <span className="text-xs text-gray-400">Lưu tự động ✓</span>}
          {notes && (
            <button
              onClick={handleDownload}
              title="Tải xuống ghi chú (.txt)"
              className="text-xs text-gray-400 hover:text-brand-600 transition-colors"
            >
              ⬇
            </button>
          )}
        </div>
      </div>
      <textarea
        id="project-notes"
        ref={textareaRef}
        value={notes}
        onChange={handleChange}
        placeholder="Ghi chú, ý tưởng, phản hồi khách hàng..."
        rows={3}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 placeholder-gray-300 overflow-hidden"
      />
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-xs text-gray-400">Lưu trữ cục bộ trên trình duyệt</p>
        <span className={`text-xs ${nearLimit ? "text-orange-500" : "text-gray-400"}`}>
          {notes.length} / {MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
