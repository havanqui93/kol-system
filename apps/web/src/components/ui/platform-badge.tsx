import { getPlatformLabel } from "@/lib/i18n";
import { clsx } from "clsx";

interface PlatformBadgeProps {
  platform: string;
  size?: "sm" | "md";
  className?: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "🎵",
  facebook: "📘",
  instagram: "📸",
  youtube_shorts: "▶️",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black text-white",
  facebook: "bg-blue-600 text-white",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  youtube_shorts: "bg-red-600 text-white",
};

export function PlatformBadge({ platform, size = "sm", className }: PlatformBadgeProps) {
  const icon = PLATFORM_ICONS[platform] ?? "📱";
  const color = PLATFORM_COLORS[platform] ?? "bg-gray-500 text-white";
  const label = getPlatformLabel(platform);

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full font-medium",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
        color,
        className
      )}
      title={label}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
