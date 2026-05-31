"use client";

import { estimatedVideoDuration, formatSeconds } from "@/lib/format";
import type { Script } from "@/lib/api/client";

interface ScriptStatsProps {
  script: Script;
  className?: string;
}

export function ScriptStats({ script, className = "" }: ScriptStatsProps) {
  const wordCount = script.wordCount ?? script.fullScript.split(/\s+/).filter(Boolean).length;
  const estimated = script.estimatedDurationSeconds ?? estimatedVideoDuration(wordCount);

  const wordsPerMinute = estimated > 0 ? Math.round((wordCount / estimated) * 60) : 0;

  const segments = [
    { label: "Số từ", value: wordCount.toLocaleString("vi-VN") },
    { label: "Thời gian ước tính", value: formatSeconds(estimated) },
    { label: "Tốc độ đọc", value: `${wordsPerMinute} từ/phút` },
  ];

  return (
    <div className={`flex items-center gap-4 text-xs text-gray-500 ${className}`}>
      {segments.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-1">
          <span className="text-gray-400">{label}:</span>
          <span className="font-medium text-gray-700">{value}</span>
        </div>
      ))}
    </div>
  );
}
