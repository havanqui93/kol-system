"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@/components/ui/card";

interface MusicPreset {
  id: string;
  name: string;
  mood: string;
  genre: string;
  bpm: number;
  durationSeconds: number;
  tags: string[];
}

export default function MusicLibraryPage() {
  const [presets, setPresets] = useState<MusicPreset[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = selectedMood ? `?mood=${selectedMood}` : "";
    fetch(`/api/music/presets${params}`)
      .then((r) => r.json())
      .then((d) => {
        setPresets(d.presets ?? []);
        if (!selectedMood) {
          setMoods(d.moods ?? []);
          setGenres(d.genres ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedMood]);

  const MOOD_LABELS: Record<string, string> = {
    energetic: "Năng động",
    calm: "Nhẹ nhàng",
    exciting: "Hứng khởi",
    emotional: "Cảm xúc",
    relaxed: "Thư giãn",
    festive: "Lễ hội",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thư viện nhạc nền</h1>
        <p className="text-sm text-gray-500 mt-1">Chọn nhạc nền phù hợp cho video KOL của bạn</p>
      </div>

      {/* Mood filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedMood("")}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
            !selectedMood ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Tất cả
        </button>
        {moods.map((mood) => (
          <button
            key={mood}
            onClick={() => setSelectedMood(mood === selectedMood ? "" : mood)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              selectedMood === mood ? "bg-brand-600 text-white border-brand-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {MOOD_LABELS[mood] ?? mood}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Đang tải...</p>
      ) : presets.length === 0 ? (
        <p className="text-sm text-gray-500">Không tìm thấy nhạc phù hợp</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {presets.map((preset) => (
            <Card key={preset.id} className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{preset.name}</h3>
                    <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{MOOD_LABELS[preset.mood] ?? preset.mood}</span>
                        <span>·</span>
                        <span className="capitalize">{preset.genre}</span>
                        <span>·</span>
                        <span>{preset.durationSeconds}s</span>
                        {preset.bpm && (
                          <>
                            <span>·</span>
                            <span>{preset.bpm} BPM</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {preset.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-2xl flex-shrink-0">
                    {preset.mood === "energetic" ? "⚡" : preset.mood === "calm" ? "🌿" : preset.mood === "festive" ? "🎉" : "🎵"}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
