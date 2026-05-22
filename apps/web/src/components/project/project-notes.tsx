"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = (id: string) => `kol-notes-${id}`;
const TS_KEY = (id: string) => `kol-notes-ts-${id}`;
const MAX_CHARS = 2000;

export function ProjectNotes({ projectId }: { projectId: string }) {
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY(projectId)) ?? "";
    setNotes(stored);
    const ts = localStorage.getItem(TS_KEY(projectId));
    if (ts) setLastUpdated(new Date(Number(ts)));
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
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY(projectId), val);
    localStorage.setItem(TS_KEY(projectId), String(now));
    setLastUpdated(new Date(now));
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
          {saved && notes && (
            <span className="text-xs text-gray-400">
              Lưu tự động ✓{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </span>
          )}
          {notes && (
            <>
              <button
                onClick={handleDownload}
                title="Tải xuống ghi chú (.txt)"
                className="text-xs text-gray-400 hover:text-brand-600 transition-colors"
              >
                ⬇
              </button>
              <button
                onClick={() => {
                  if (!confirm("Xóa tất cả ghi chú?")) return;
                  setNotes("");
                  localStorage.removeItem(STORAGE_KEY(projectId));
                  localStorage.removeItem(TS_KEY(projectId));
                  setLastUpdated(null);
                }}
                title="Xóa ghi chú"
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                ×
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-1 mb-1 flex-wrap">
        {["✅", "⚠️", "❌", "💡", "🔥", "📌"].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => {
              const ta = textareaRef.current;
              if (!ta) return;
              const pos = ta.selectionStart ?? notes.length;
              const newVal = notes.slice(0, pos) + emoji + " " + notes.slice(pos);
              const ev = { target: { value: newVal } } as React.ChangeEvent<HTMLTextAreaElement>;
              handleChange(ev);
              setTimeout(() => { ta.focus(); ta.setSelectionRange(pos + emoji.length + 1, pos + emoji.length + 1); }, 0);
            }}
            className="text-base hover:scale-125 transition-transform"
            title={`Thêm ${emoji}`}
          >
            {emoji}
          </button>
        ))}
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
