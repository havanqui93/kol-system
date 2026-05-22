"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineEdit } from "@/components/project/inline-edit";
import { api, type Project } from "@/lib/api/client";

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: "🎵",
  facebook: "📘",
  instagram: "📸",
  youtube_shorts: "▶️",
};

const STATUS_PROGRESS: Record<string, number> = {
  draft: 5,
  script_generating: 15,
  script_ready: 25,
  script_approved: 30,
  audio_generating: 40,
  audio_ready: 50,
  video_generating: 60,
  clips_ready: 70,
  rendering: 80,
  rendered: 85,
  qa_checking: 90,
  ready_to_publish: 95,
  publishing: 97,
  published: 100,
  failed: 0,
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

export function ProjectCard({ project, onDeleted }: { project: Project; onDeleted?: (id: string) => void }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [title, setTitle] = useState(project.title ?? `Video ${project.id.slice(-6)}`);
  const isProcessing = ["script_generating", "audio_generating", "video_generating", "rendering", "qa_checking", "publishing"].includes(project.status);

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.projects.delete(project.id);
      success("Đã xóa dự án");
      if (onDeleted) {
        onDeleted(project.id);
      } else {
        router.refresh();
      }
    } catch {
      toastError("Xóa thất bại, thử lại sau.");
      setDeleting(false);
    }
  }

  async function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDuplicating(true);
    try {
      const clone = await api.projects.duplicate(project.id);
      success("Đã tạo bản sao dự án");
      router.push(`/projects/${clone.id}`);
    } catch {
      toastError("Sao chép thất bại, thử lại sau.");
      setDuplicating(false);
    }
  }

  const cardBorderClass =
    project.status === "failed" ? "border-l-4 border-l-red-400" :
    project.status === "published" || project.status === "ready_to_publish" ? "border-l-4 border-l-green-400" :
    isProcessing ? "border-l-4 border-l-yellow-400" : "";

  return (
    <div className="relative group">
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Xóa dự án"
        message={`Xóa dự án "${title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <Link href={`/projects/${project.id}`}>
        <Card className={`hover:border-brand-300 hover:shadow-md transition-all cursor-pointer ${cardBorderClass}`}>
          <CardBody className="flex items-start gap-4">
            {/* Thumbnail / product image */}
            <div className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {(project.thumbnailUrl ?? project.product?.imageUrl ?? project.product?.imageUrls?.[0]) ? (
                <img
                  src={(project.thumbnailUrl ?? project.product?.imageUrl ?? project.product?.imageUrls?.[0])!}
                  alt={project.product?.name ?? ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-100 to-purple-100 flex items-center justify-center text-2xl">
                  {PLATFORM_ICONS[project.platform] ?? "🎬"}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 truncate min-w-0" onClick={(e) => e.preventDefault()}>
                  <InlineEdit
                    value={title}
                    onSave={async (newTitle) => {
                      await api.projects.rename(project.id, newTitle);
                      setTitle(newTitle);
                      success("Đã đổi tên");
                    }}
                  />
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
                {project.kolProfile && (
                  <>
                    <span>·</span>
                    <span className="text-gray-500">🎭 {project.kolProfile.name}</span>
                  </>
                )}
              </div>

              {/* Pipeline progress bar */}
              {project.status !== "draft" && project.status !== "failed" && (
                <div className="mt-2">
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        project.status === "published" ? "bg-green-400" : isProcessing ? "bg-yellow-400 animate-pulse" : "bg-brand-400"
                      }`}
                      style={{ width: `${STATUS_PROGRESS[project.status] ?? 50}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">{timeAgo(project.createdAt)}</span>
                {isProcessing && (
                  <span className="flex items-center gap-1 text-xs text-yellow-700">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    Đang xử lý
                  </span>
                )}
                {project.status === "draft" && (
                  <span className="text-xs text-brand-600 font-medium">▶ Tiếp tục →</span>
                )}
                {project.status === "script_ready" && (
                  <span className="text-xs text-orange-600 font-medium">⏳ Chờ duyệt kịch bản</span>
                )}
                {project.finalVideoUrl && (
                  <span className="text-xs text-green-700 font-medium">✓ Video sẵn sàng</span>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </Link>

      {/* Action buttons — visible on hover */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDuplicate}
          disabled={duplicating || deleting}
          title="Sao chép dự án"
          className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-brand-600 hover:border-brand-300 items-center justify-center text-xs shadow-sm flex disabled:opacity-30"
        >
          {duplicating ? "…" : "⎘"}
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(true); }}
          disabled={deleting || duplicating}
          title="Xóa dự án"
          className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 items-center justify-center text-sm shadow-sm flex disabled:opacity-30"
        >
          {deleting ? "…" : "×"}
        </button>
      </div>
    </div>
  );
}
