"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface MusicPreset {
  id: string;
  name: string;
  mood: string;
  genre: string;
  durationSeconds: number;
  tags: string[];
  url: string | null;
}

interface MusicPickerProps {
  onSelect: (preset: MusicPreset | null) => void;
  selected?: MusicPreset | null;
}

export function MusicPicker({ onSelect, selected }: MusicPickerProps) {
  const [presets, setPresets] = useState<MusicPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/music/presets")
      .then((r) => r.json())
      .then((d) => setPresets(d.presets ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? presets.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          p.mood.includes(filter) ||
          p.tags.some((t) => t.includes(filter))
      )
    : presets;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Tìm nhạc..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        {selected && (
          <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
            ✕ Bỏ chọn
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Đang tải danh sách nhạc...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-400">Không tìm thấy nhạc phù hợp</p>
      ) : (
        <div className="grid gap-2 max-h-60 overflow-y-auto">
          {filtered.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelect(preset.id === selected?.id ? null : preset)}
              className={`text-left rounded-lg border px-3 py-2 text-xs transition-colors ${
                selected?.id === preset.id
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="font-medium text-gray-800">{preset.name}</div>
              <div className="text-gray-500 mt-0.5 flex items-center gap-2">
                <span className="capitalize">{preset.mood}</span>
                <span>·</span>
                <span>{preset.durationSeconds}s</span>
                <span>·</span>
                <span className="capitalize">{preset.genre}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
