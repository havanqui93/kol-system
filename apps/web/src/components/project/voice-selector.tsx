"use client";

import { useEffect, useRef, useState } from "react";

interface Voice {
  id: string;
  name: string;
  provider: string;
  gender: string;
  style: string;
  language: string;
  previewUrl?: string;
}

interface VoiceSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function VoiceSelector({ selectedId, onSelect }: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/voices")
      .then((r) => r.json())
      .then((d) => { setVoices(d.voices ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function togglePreview(voiceId: string, previewUrl?: string) {
    if (!previewUrl) return;

    if (playing === voiceId) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    audio.play().catch(() => {});
    audio.onended = () => setPlaying(null);
    setPlaying(voiceId);
  }

  if (loading) return <div className="text-xs text-gray-400">Đang tải giọng đọc...</div>;

  return (
    <div className="grid gap-2">
      {voices.map((voice) => {
        const isSelected = selectedId === voice.id;
        const isPlaying = playing === voice.id;
        return (
          <button
            key={voice.id}
            type="button"
            onClick={() => onSelect(voice.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
              isSelected ? "border-brand-400 bg-brand-50" : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <span className="text-lg">{voice.gender === "female" ? "👩" : "👨"}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{voice.name}</div>
              <div className="text-xs text-gray-500 capitalize">{voice.style} · {voice.language.toUpperCase()}</div>
            </div>
            {isSelected && <span className="text-brand-600 text-sm">✓</span>}
            {voice.previewUrl && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); togglePreview(voice.id, voice.previewUrl); }}
                className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 text-gray-600"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
            )}
          </button>
        );
      })}
    </div>
  );
}
