"use client";

import { useState, useRef, useEffect } from "react";

interface InlineEditProps {
  value: string;
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
}

export function InlineEdit({ value, placeholder = "Nhập tiêu đề...", onSave, className }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function handleSave() {
    if (draft.trim() === value || !draft.trim()) {
      setEditing(false);
      setDraft(value);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft.trim());
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setEditing(false); setDraft(value); }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={saving}
        placeholder={placeholder}
        className={`border-b-2 border-brand-400 bg-transparent outline-none font-bold text-gray-900 min-w-0 w-full ${className}`}
        aria-label="Chỉnh sửa tiêu đề"
      />
    );
  }

  return (
    <button
      onClick={() => { setEditing(true); setDraft(value); }}
      title="Nhấp để chỉnh sửa"
      className={`text-left hover:text-brand-700 group ${className}`}
    >
      {value || <span className="text-gray-400">{placeholder}</span>}
      <span className="ml-1 text-xs text-gray-300 group-hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">✏</span>
    </button>
  );
}
