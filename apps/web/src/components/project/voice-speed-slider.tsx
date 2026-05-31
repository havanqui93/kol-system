"use client";

import { useState } from "react";

interface VoiceSpeedSliderProps {
  value?: number;
  onChange: (speed: number) => void;
  className?: string;
}

const SPEED_LABELS: Record<string, string> = {
  "0.75": "Chậm (0.75×)",
  "0.9": "Hơi chậm (0.9×)",
  "1.0": "Bình thường (1.0×)",
  "1.1": "Hơi nhanh (1.1×)",
  "1.25": "Nhanh (1.25×)",
  "1.5": "Rất nhanh (1.5×)",
};

export function VoiceSpeedSlider({ value = 1.0, onChange, className = "" }: VoiceSpeedSliderProps) {
  const [speed, setSpeed] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setSpeed(v);
    onChange(v);
  };

  const nearestLabel = SPEED_LABELS[speed.toFixed(2)] ??
    SPEED_LABELS[speed.toFixed(1)] ??
    `${speed.toFixed(2)}×`;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">Tốc độ giọng nói</label>
        <span className="text-xs font-medium text-brand-600">{nearestLabel}</span>
      </div>

      <input
        type="range"
        min="0.75"
        max="1.5"
        step="0.05"
        value={speed}
        onChange={handleChange}
        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600"
        aria-label="Tốc độ giọng nói"
      />

      <div className="flex justify-between text-xs text-gray-400">
        <span>0.75×</span>
        <span>1.0×</span>
        <span>1.5×</span>
      </div>

      <p className="text-xs text-gray-500">
        Tốc độ chậm hơn giúp dễ nghe hơn. Nhanh hơn phù hợp với video ngắn.
      </p>
    </div>
  );
}
