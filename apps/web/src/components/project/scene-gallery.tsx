"use client";

import { useState } from "react";

interface SceneClip {
  id: string;
  url: string;
  assetType: string;
  durationMs: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface SceneGalleryProps {
  clips: SceneClip[];
  projectId: string;
}

function formatDuration(ms: number | null) {
  if (!ms) return "";
  return `${(ms / 1000).toFixed(1)}s`;
}

export function SceneGallery({ clips }: SceneGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (clips.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {clips.map((clip, i) => (
          <div key={clip.id} className="relative group">
            <div
              className={`relative rounded-lg overflow-hidden bg-gray-900 cursor-pointer border-2 transition-colors ${
                activeIndex === i ? "border-brand-500" : "border-transparent hover:border-gray-300"
              }`}
              style={{ aspectRatio: "9/16" }}
              onClick={() => setActiveIndex(activeIndex === i ? null : i)}
            >
              <video
                src={clip.url}
                preload="metadata"
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                <span className="text-[10px] text-white bg-black/60 px-1 rounded">Cảnh {i + 1}</span>
                {clip.durationMs && (
                  <span className="text-[10px] text-white bg-black/60 px-1 rounded">{formatDuration(clip.durationMs)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded view */}
      {activeIndex !== null && clips[activeIndex] && (
        <div className="mt-3 bg-gray-900 rounded-xl p-4 flex gap-4">
          <video
            src={clips[activeIndex].url}
            controls
            autoPlay
            loop
            className="rounded-lg bg-black flex-shrink-0"
            style={{ height: 320, aspectRatio: "9/16" }}
          />
          <div className="text-white">
            <h4 className="font-semibold mb-2">Cảnh {activeIndex + 1}</h4>
            <dl className="space-y-1 text-sm">
              {clips[activeIndex].durationMs && (
                <div>
                  <dt className="text-gray-400 text-xs">Thời lượng</dt>
                  <dd>{formatDuration(clips[activeIndex].durationMs)}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-400 text-xs">Tạo lúc</dt>
                <dd>{new Date(clips[activeIndex].createdAt).toLocaleString("vi-VN")}</dd>
              </div>
              <div className="mt-3">
                <a
                  href={clips[activeIndex].url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-400 hover:underline"
                >
                  Mở full resolution ↗
                </a>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
