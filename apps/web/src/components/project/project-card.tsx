"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isProcessing = [
    "script_generating",
    "audio_generating",
    "video_generating",
    "rendering",
    "qa_checking",
    "publishing",
  ].includes(project.status);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setDeleting(true);
    try {
      await fetch(`/api/video-projects/${project.id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setDeleting(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group">
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
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={project.status} />

                {/* Delete button — visible on hover */}
                {showConfirm ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                    <Button
                      size="sm"
                      variant="danger"
                      loading={deleting}
                      onClick={handleDelete}
                    >
                      Xác nhận xoá
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelDelete}>
                      Huỷ
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={handleDelete}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                    title="Xoá project"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
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
                  <span className="text-gray-700">{(project.product as any).name}</span>
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
