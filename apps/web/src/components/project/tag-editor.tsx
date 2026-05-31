"use client";

import { useEffect, useRef, useState } from "react";

interface TagEditorProps {
  projectId: string;
}

export function TagEditor({ projectId }: TagEditorProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/video-projects/${projectId}/tags`)
      .then((r) => r.json())
      .then((d) => setTags(d.tags ?? []));
  }, [projectId]);

  async function addTag() {
    const tag = input.trim();
    if (!tag) return;
    setError("");
    const res = await fetch(`/api/video-projects/${projectId}/tags`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tag }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Lỗi"); return; }
    setTags(d.tags);
    setInput("");
  }

  async function removeTag(tag: string) {
    const res = await fetch(`/api/video-projects/${projectId}/tags?tag=${encodeURIComponent(tag)}`, {
      method: "DELETE",
    });
    const d = await res.json();
    if (res.ok) setTags(d.tags);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-full"
        >
          #{tag}
          <button
            onClick={() => removeTag(tag)}
            className="text-brand-400 hover:text-brand-700 leading-none"
            title="Xoá tag"
          >
            ×
          </button>
        </span>
      ))}
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder={tags.length < 10 ? "thêm tag..." : ""}
          disabled={tags.length >= 10}
          className="text-xs border-0 border-b border-dashed border-gray-300 focus:outline-none focus:border-brand-400 bg-transparent px-1 w-24 disabled:opacity-40"
        />
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
