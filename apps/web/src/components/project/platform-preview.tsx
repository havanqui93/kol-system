"use client";

interface PlatformPreviewProps {
  videoUrl: string;
  platform: string;
  title?: string;
}

const PLATFORM_META: Record<string, { label: string; bgColor: string; textColor: string; icon: string }> = {
  tiktok: { label: "TikTok", bgColor: "#000", textColor: "#fff", icon: "🎵" },
  facebook: { label: "Facebook Reels", bgColor: "#1877F2", textColor: "#fff", icon: "📘" },
  instagram: { label: "Instagram Reels", bgColor: "#C13584", textColor: "#fff", icon: "📸" },
  youtube_shorts: { label: "YouTube Shorts", bgColor: "#FF0000", textColor: "#fff", icon: "▶️" },
};

export function PlatformPreview({ videoUrl, platform, title }: PlatformPreviewProps) {
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.tiktok;

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div
        className="relative rounded-[2rem] border-4 border-gray-800 overflow-hidden shadow-2xl bg-black"
        style={{ width: 180, height: 390 }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-b-xl z-10" />

        {/* Video */}
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Overlay UI — platform-specific */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top bar */}
          <div
            className="absolute top-4 left-0 right-0 flex items-center justify-between px-3 pt-3"
            style={{ color: meta.textColor }}
          >
            <span className="text-xs opacity-70">{meta.icon} {meta.label}</span>
            <span className="text-xs opacity-50">●●●</span>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-4 left-3 right-10" style={{ color: meta.textColor }}>
            <p className="text-xs font-semibold truncate drop-shadow">{title ?? "Video"}</p>
          </div>

          {/* Side actions */}
          <div className="absolute right-2 bottom-16 flex flex-col gap-3 items-center" style={{ color: meta.textColor }}>
            {["❤️", "💬", "↗️"].map((icon) => (
              <div key={icon} className="flex flex-col items-center">
                <span className="text-sm drop-shadow">{icon}</span>
                <span className="text-[9px] opacity-70">0</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">{meta.label} preview</p>
    </div>
  );
}
