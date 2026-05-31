"use client";

import { validateDuration } from "@/lib/platform-limits";

interface DurationWarningProps {
  platform: string;
  durationSeconds: number;
  className?: string;
}

export function DurationWarning({ platform, durationSeconds, className = "" }: DurationWarningProps) {
  const warning = validateDuration(platform, durationSeconds);

  if (!warning) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800 ${className}`}
    >
      <span className="flex-shrink-0 mt-0.5">⚠️</span>
      <span>{warning}</span>
    </div>
  );
}
