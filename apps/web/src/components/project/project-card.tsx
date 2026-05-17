import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import type { Project } from "@/lib/api/client";

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "🎵",
  facebook: "📘",
  instagram: "📸",
  youtube_shorts: "▶️",
};

const VIDEO_TYPE_LABELS: Record<string, string> = {
  product_review: "Review sản phẩm",
  affiliate: "Affiliate",
  used_car: "Ô tô cũ",
  virtual_kol: "KOL ảo",
  b_roll: "B-roll",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

export function ProjectCard({ project }: { project: Project }) {
  const isProcessing = ["script_generating", "audio_generating", "video_generating", "rendering", "qa_checking", "publishing"].includes(project.status);

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-brand-300 hover:shadow-md transition-all cursor-pointer">
        <CardBody className="flex items-start gap-4">
          {/* Thumbnail / placeholder */}
          <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center text-2xl flex-shrink-0">
            {PLATFORM_ICONS[project.platform] ?? "🎬"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {project.title ?? `Video ${project.id.slice(-6)}`}
              </h3>
              <StatusBadge status={project.status} />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span>{VIDEO_TYPE_LABELS[project.videoType] ?? project.videoType}</span>
              <span>·</span>
              <span>{project.durationSeconds}s</span>
              <span>·</span>
              <span>{project.language.toUpperCase()}</span>
              {project.product && (
                <>
                  <span>·</span>
                  <span className="text-gray-700">{project.product.name}</span>
                </>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">{timeAgo(project.createdAt)}</span>
              {isProcessing && (
                <span className="flex items-center gap-1 text-xs text-yellow-700">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  Đang xử lý
                </span>
              )}
              {project.finalVideoUrl && (
                <span className="text-xs text-green-700 font-medium">✓ Video sẵn sàng</span>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
