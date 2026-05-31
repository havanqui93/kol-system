"use client";

import { useCallback, useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
}

export function VideoPlayer({ src, poster, className = "", aspectRatio = "9:16" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  const aspectClasses = {
    "9:16": "aspect-[9/16]",
    "16:9": "aspect-video",
    "1:1": "aspect-square",
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    v.currentTime = (x / rect.width) * v.duration;
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className={`relative bg-black rounded-xl overflow-hidden group ${aspectClasses[aspectRatio]} ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
        playsInline
        preload="metadata"
      />

      {/* Play/Pause overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={togglePlay}
      >
        {!playing && (
          <div className="bg-black/50 rounded-full w-14 h-14 flex items-center justify-center backdrop-blur-sm transition-opacity group-hover:opacity-100 opacity-80">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Seek bar */}
        <div
          className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-2 relative"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="text-white hover:text-gray-200 text-xs">
              {playing ? "⏸" : "▶"}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-gray-200 text-xs">
              {muted ? "🔇" : "🔊"}
            </button>
            {duration > 0 && (
              <span className="text-white text-xs opacity-70">
                {formatTime((progress / 100) * duration)} / {formatTime(duration)}
              </span>
            )}
          </div>
          <a
            href={src}
            download
            className="text-white text-xs hover:text-gray-200 opacity-70 hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            ⬇
          </a>
        </div>
      </div>
    </div>
  );
}
