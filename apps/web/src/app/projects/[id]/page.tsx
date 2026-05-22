"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProject } from "@/hooks/use-project";
import { api } from "@/lib/api/client";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ProjectDetailSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineEdit } from "@/components/project/inline-edit";
import { ScriptViewer } from "@/components/project/script-viewer";
import { PipelineStep } from "@/components/project/pipeline-step";
import { PublishPanel } from "@/components/project/publish-panel";
import { ProjectNotes } from "@/components/project/project-notes";
import { trackVisited } from "@/components/project/last-visited-banner";

// Helper: which pipeline step is each status on
function getStepStatus(projectStatus: string, stepStatuses: string[], activeStatuses: string[], doneStatuses: string[]) {
  if (doneStatuses.some((s) => projectStatus === s || stepStatuses.indexOf(projectStatus) > stepStatuses.indexOf(s))) return "done";
  if (activeStatuses.includes(projectStatus)) return "active";
  if (projectStatus === "failed") return "error";
  return "pending";
}

const VOICE_STYLE_OPTIONS = [
  { value: "energetic", label: "Năng động" },
  { value: "professional", label: "Chuyên nghiệp" },
  { value: "calm", label: "Bình tĩnh" },
  { value: "funny", label: "Hài hước" },
];

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast, success, error: toastError } = useToast();
  const { project, loading, error, refresh } = useProject(params.id);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [voiceStyle, setVoiceStyle] = useState("energetic");
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [hashtags, setHashtags] = useState<string[] | null>(null);
  const [hashtagCaption, setHashtagCaption] = useState<string | null>(null);
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<number | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Track last visited project in localStorage
  useEffect(() => {
    if (!project) return;
    trackVisited({ id: project.id, title: project.title ?? `Video #${project.id.slice(-6)}`, status: project.status });
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcut: r = refresh
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "r" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        refresh();
        toast("Đã làm mới", "info");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [refresh, toast]);

  const doAction = useCallback(async (key: string, fn: () => Promise<unknown>, successMsg?: string) => {
    setActionLoading(key);
    setActionError(null);
    try {
      await fn();
      await refresh();
      if (successMsg) success(successMsg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      setActionError(msg);
      toastError(msg);
    } finally {
      setActionLoading(null);
    }
  }, [refresh, success, toastError]);

  // Poll render job progress while rendering
  useEffect(() => {
    if (!renderJobId || !project || project.status !== "rendering") return;
    const id = setInterval(async () => {
      try {
        const job = await api.render.getJob(renderJobId);
        if (job.status === "completed") {
          setRenderProgress(100);
          clearInterval(id);
          refresh();
        } else if (job.status === "failed") {
          clearInterval(id);
          refresh();
        }
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, [renderJobId, project?.status, refresh]);

  if (loading) return <ProjectDetailSkeleton />;
  if (error || !project) {
    return (
      <div className="text-center py-24">
        <p className="text-red-600">{error ?? "Không tìm thấy dự án"}</p>
        <Link href="/" className="text-brand-600 underline text-sm mt-2 inline-block">Về trang chủ</Link>
      </div>
    );
  }

  const status = project.status;
  const approvedScript = project.scripts.find((s) => s.isApproved);
  const audioAsset = project.assets.find((a) => a.assetType === "audio");
  const videoClipAssets = project.assets.filter((a) => a.assetType === "video_clip");
  const finalVideo = project.finalVideoUrl;

  // Derive per-step status
  const scriptStep = getStepStatus(
    status,
    [],
    ["script_generating"],
    ["script_ready", "script_approved", "audio_generating", "audio_ready", "video_generating", "clips_ready", "rendering", "rendered", "qa_checking", "ready_to_publish", "publishing", "published"]
  );

  const audioStep: "pending" | "active" | "done" | "error" = approvedScript
    ? getStepStatus(status, [], ["audio_generating"], ["audio_ready", "video_generating", "clips_ready", "rendering", "rendered", "qa_checking", "ready_to_publish", "publishing", "published"])
    : "pending";

  const videoStep: "pending" | "active" | "done" | "error" = audioAsset
    ? getStepStatus(status, [], ["video_generating"], ["clips_ready", "rendering", "rendered", "qa_checking", "ready_to_publish", "publishing", "published"])
    : "pending";

  const renderStep: "pending" | "active" | "done" | "error" = audioAsset
    ? getStepStatus(status, [], ["rendering"], ["rendered", "qa_checking", "ready_to_publish", "publishing", "published"])
    : "pending";

  return (
    <div className="max-w-3xl mx-auto">
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Xóa dự án"
        message={`Xóa dự án "${project.title ?? project.id.slice(-6)}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        danger
        onConfirm={async () => { await api.projects.delete(project.id); router.push("/"); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/" className="hover:text-gray-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-700 truncate max-w-xs">{project.title ?? `Video ${params.id.slice(-6)}`}</span>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-xl font-bold text-gray-900 min-w-0">
              <InlineEdit
                value={project.title ?? `Video ${params.id.slice(-6)}`}
                onSave={(title) => doAction("rename", () => api.projects.rename(project.id, title), "Đã đổi tên")}
              />
            </h1>
            <StatusBadge status={status} />
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
              {{ tiktok: "🎵 TikTok", facebook: "📘 Facebook", instagram: "📸 Instagram", youtube_shorts: "▶️ YouTube" }[project.platform] ?? project.platform}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/new?platform=${project.platform}&videoType=${project.videoType}&durationSeconds=${project.durationSeconds}&qualityPreset=${project.qualityPreset}`}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            title="Tạo video mới với cùng cài đặt"
          >
            ⎘ Clone
          </Link>
          <a
            href={api.projects.exportUrl(project.id)}
            download
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            title="Xuất dữ liệu JSON"
          >
            ⬇ JSON
          </a>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); success("Đã sao chép link dự án"); }}
            title="Sao chép link dự án này"
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            🔗 Sao chép link
          </button>
          <button
            onClick={() => {
              const summary = [
                `Tên: ${project.title ?? "Video " + project.id.slice(-6)}`,
                `Trạng thái: ${project.status}`,
                `Nền tảng: ${project.platform}`,
                `Thời lượng: ${project.durationSeconds}s`,
                `ID: ${project.id}`,
                `URL: ${window.location.href}`,
              ].join("\n");
              navigator.clipboard.writeText(summary);
              success("Đã sao chép tóm tắt dự án");
            }}
            title="Sao chép tóm tắt dự án"
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            📋 Tóm tắt
          </button>
          <Button variant="ghost" size="sm" onClick={() => refresh()} aria-label="Làm mới">
            ↻ Làm mới
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Xóa
          </Button>
        </div>
      </div>

      {/* Product + KOL summary */}
      {(project.product || project.kolProfile) && (
        <div className="mb-4 flex flex-wrap gap-3">
          {project.product && (
            <div className="flex items-center gap-3 flex-1 min-w-0 bg-gray-50 rounded-xl px-4 py-3 relative">
              {project.product.imageUrls?.[0] && (
                <img src={project.product.imageUrls[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-400 mb-0.5">Sản phẩm</div>
                <div className="font-medium text-gray-900 truncate text-sm">{project.product.name}</div>
                {project.product.price && (
                  <div className="text-xs text-gray-500">{Number(project.product.price).toLocaleString("vi-VN")} VND</div>
                )}
                {project.product.promotion && (
                  <div className="text-xs text-green-600">{project.product.promotion}</div>
                )}
              </div>
              <Link href="/products" className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0" title="Xem tất cả sản phẩm">→</Link>
            </div>
          )}
          {project.kolProfile && (
            <div className="flex items-center gap-3 flex-1 min-w-0 bg-gray-50 rounded-xl px-4 py-3">
              {project.kolProfile.avatarImageUrl && (
                <img src={project.kolProfile.avatarImageUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs text-gray-400 mb-0.5">KOL Profile</div>
                <div className="font-medium text-gray-900 truncate text-sm">{project.kolProfile.name}</div>
                {project.kolProfile.voiceStyle && (
                  <div className="text-xs text-gray-500">{project.kolProfile.voiceStyle}{project.kolProfile.language ? ` · ${project.kolProfile.language.toUpperCase()}` : ""}</div>
                )}
              </div>
              <Link href="/kol-profiles" className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0" title="Xem tất cả KOL profiles">→</Link>
            </div>
          )}
        </div>
      )}

      {/* Error banner with retry */}
      {(project.errorMessage || actionError) && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-4">
          <span>{actionError ?? project.errorMessage}</span>
          {status === "failed" && !actionError && (
            <Button
              size="sm"
              variant="secondary"
              loading={actionLoading === "retry"}
              onClick={() => doAction("retry", () => api.projects.retry(project.id), "Đã đặt lại trạng thái")}
            >
              Thử lại
            </Button>
          )}
        </div>
      )}

      {/* Final video preview — improved player */}
      {finalVideo && (
        <Card className="mb-6 border-green-200 bg-green-50/30">
          <CardBody>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <video
                  src={finalVideo}
                  controls
                  loop
                  playsInline
                  className="rounded-xl bg-black shadow-md"
                  style={{ width: 144, aspectRatio: "9/16" }}
                />
              </div>
              <div className="flex-1 pt-1">
                <div className="text-green-700 font-semibold mb-1">✓ Video đã sẵn sàng!</div>
                <p className="text-xs text-gray-500 mb-4">Video 9:16 đã được render thành công.</p>
                <div className="flex flex-wrap gap-2">
                  <a href={finalVideo} download target="_blank" rel="noreferrer">
                    <Button size="sm">⬇ Tải xuống MP4</Button>
                  </a>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => { navigator.clipboard.writeText(finalVideo); success("Đã sao chép link video"); }}
                  >
                    ⎘ Sao chép link
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const url = `${window.location.origin}/share/${project.id}`;
                      navigator.clipboard.writeText(url);
                      success("Đã sao chép link chia sẻ");
                    }}
                  >
                    🔗 Chia sẻ
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-3">Nhấn Space để phát/dừng · Loop bật sẵn</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pipeline steps */}
      <div className="space-y-4">
        {/* Step 1: Script */}
        <PipelineStep
          step={1}
          title="Kịch bản"
          description="AI phân tích sản phẩm và viết kịch bản viral"
          status={scriptStep}
        >
          {status === "draft" && (
            <Button
              size="sm"
              loading={actionLoading === "script"}
              onClick={() => doAction("script", () => api.script.generate(project.id), "Đã gửi yêu cầu tạo kịch bản")}
            >
              Tạo kịch bản
            </Button>
          )}

          {status === "script_generating" && (
            <p className="text-xs text-brand-700 animate-pulse">Đang phân tích sản phẩm và viết kịch bản...</p>
          )}

          {/* Version history pill */}
          {project.scripts.length > 1 && (
            <p className="text-xs text-gray-400 mb-2">
              {project.scripts.length} phiên bản · {project.scripts.filter(s => s.isApproved).length > 0 ? "v" + project.scripts.find(s => s.isApproved)?.version + " đã duyệt" : "chưa có phiên bản được duyệt"}
            </p>
          )}

          {project.scripts.length > 0 && status !== "script_generating" && (
            <ScriptViewer
              scripts={project.scripts}
              disabled={!!approvedScript || actionLoading !== null}
              targetDurationSeconds={project.durationSeconds}
              onApprove={(scriptId) =>
                doAction("approve", () => api.script.approve(project.id, scriptId), "Kịch bản đã được duyệt")
              }
              onRegenerate={
                !approvedScript
                  ? () => doAction("script", () => api.script.regenerate(project.id), "Đang tạo lại kịch bản...")
                  : undefined
              }
            />
          )}

          {/* Script download */}
          {approvedScript && (
            <button
              className="mt-2 text-xs text-brand-600 hover:underline"
              onClick={() => {
                const blob = new Blob([approvedScript.fullScript], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `script-${project.id.slice(-6)}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              ⬇ Tải kịch bản (.txt)
            </button>
          )}

          {(status === "script_ready" || status === "script_approved") && !approvedScript && project.scripts.length === 0 && (
            <p className="text-xs text-gray-500">Kịch bản đang được tải...</p>
          )}
        </PipelineStep>

        {/* Step 2: Audio */}
        <PipelineStep
          step={2}
          title="Giọng nói & Phụ đề"
          description="Tạo voiceover tiếng Việt + phụ đề tự động bằng Whisper"
          status={audioStep}
        >
          {audioStep === "pending" && approvedScript && status === "script_approved" && (
            <div className="flex items-center gap-3">
              <select
                value={voiceStyle}
                onChange={(e) => setVoiceStyle(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
              >
                {VOICE_STYLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Button
                size="sm"
                loading={actionLoading === "audio"}
                onClick={() =>
                  doAction("audio", () =>
                    api.audio.generate(project.id, { voiceGender: "female", voiceStyle: voiceStyle as any }),
                    "Đã gửi yêu cầu tạo giọng nói"
                  )
                }
              >
                Tạo giọng nói
              </Button>
            </div>
          )}

          {status === "audio_generating" && (
            <p className="text-xs text-brand-700 animate-pulse">Đang tổng hợp giọng nói và phụ đề...</p>
          )}

          {audioAsset && (
            <div className="space-y-2">
              <audio controls src={audioAsset.url} className="w-full h-8" />
              <p className="text-xs text-gray-500">
                Thời lượng: {audioAsset.durationMs ? `${(audioAsset.durationMs / 1000).toFixed(1)}s` : "?"}
              </p>
            </div>
          )}
        </PipelineStep>

        {/* Step 3: Kling clips */}
        <PipelineStep
          step={3}
          title="Kling video clips"
          description="Tạo talking-head/avatar clip và product motion bằng Kling"
          status={videoStep}
        >
          {videoStep === "pending" && audioAsset && status === "audio_ready" && (
            <Button
              size="sm"
              loading={actionLoading === "kling"}
              onClick={() => doAction("kling", () => api.kling.generate(project.id), "Đã gửi yêu cầu tạo Kling clips")}
            >
              Tạo Kling clips
            </Button>
          )}

          {status === "video_generating" && (
            <p className="text-xs text-brand-700 animate-pulse">Đang tạo clip avatar/product bằng Kling...</p>
          )}

          {project.scenes.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {videoClipAssets.length} / {project.scenes.length} clips hoàn thành
              </p>
              <div className="grid grid-cols-2 gap-3">
                {project.scenes.map((scene) => (
                  <div key={scene.id} className="rounded-lg border border-gray-200 overflow-hidden text-xs">
                    {scene.clipUrl ? (
                      <video
                        src={scene.clipUrl}
                        controls
                        muted
                        playsInline
                        className="w-full bg-black"
                        style={{ aspectRatio: "9/16", maxHeight: 160 }}
                      />
                    ) : (
                      <div className="bg-gray-100 flex items-center justify-center" style={{ height: 90 }}>
                        {scene.status === "processing" ? (
                          <span className="text-yellow-600 animate-pulse">Đang tạo...</span>
                        ) : (
                          <span className="text-gray-400">{scene.status}</span>
                        )}
                      </div>
                    )}
                    <div className="px-2 py-1.5">
                      <div className="font-medium text-gray-700 truncate">
                        #{scene.sceneIndex} {scene.visualType.replace(/_/g, " ")}
                      </div>
                      <div className={scene.status === "completed" ? "text-green-600" : "text-gray-400"}>
                        {scene.status === "completed" ? "✓ sẵn sàng" : scene.status} · {scene.durationSeconds}s
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PipelineStep>

        {/* Step 4: Render */}
        <PipelineStep
          step={4}
          title="Render video cuối"
          description="FFmpeg ghép clips + audio + phụ đề thành MP4 9:16"
          status={renderStep}
        >
          {renderStep === "pending" && status === "clips_ready" && (
            <div className="space-y-3">
              <div>
                <label htmlFor="musicFile" className="block text-xs font-medium text-gray-600 mb-1">
                  Nhạc nền viral
                </label>
                <input
                  id="musicFile"
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/aac"
                  onChange={(e) => setMusicFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-50"
                />
              </div>
              <Button
                size="sm"
                loading={actionLoading === "render"}
                onClick={() =>
                  doAction("render", async () => {
                    const musicUpload = musicFile ? await api.uploads.music(musicFile) : null;
                    const result = await api.render.start(project.id, { backgroundMusicUrl: musicUpload?.url });
                    setRenderJobId(result.renderJobId);
                    setRenderProgress(0);
                  }, "Render đã bắt đầu")
                }
              >
                Bắt đầu render
              </Button>
            </div>
          )}

          {status === "rendering" && (
            <div className="space-y-2">
              <p className="text-xs text-brand-700 animate-pulse">Đang render video, vui lòng chờ...</p>
              <ProgressBar value={renderProgress} label="Tiến độ render" />
            </div>
          )}

          {finalVideo && renderStep === "done" && (
            <p className="text-xs text-green-700">Video đã render thành công ↑</p>
          )}
        </PipelineStep>

        {/* Step 5: Publish */}
        {finalVideo && (
          <PublishPanel
            projectId={project.id}
            disabled={actionLoading !== null}
          />
        )}

        {/* Hashtag generator */}
        {approvedScript && (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-gray-800"># Hashtags & Caption</h3>
                  {hashtags && (
                    <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">{hashtags.length} tags</span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={actionLoading === "hashtags"}
                  onClick={async () => {
                    setActionLoading("hashtags");
                    try {
                      const result = await api.hashtags.generate(project.id);
                      setHashtags(result.hashtags);
                      setHashtagCaption(result.caption);
                      success("Đã tạo hashtags");
                    } catch (err) {
                      toastError(err instanceof Error ? err.message : "Lỗi tạo hashtags");
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                >
                  Tạo hashtags AI
                </Button>
              </div>
              {hashtags && (
                <div className="space-y-3">
                  {hashtagCaption && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Caption</p>
                      <p className="text-sm text-gray-800">{hashtagCaption}</p>
                      <button
                        className="text-xs text-brand-600 hover:underline mt-1"
                        onClick={() => { navigator.clipboard.writeText(hashtagCaption); success("Đã sao chép caption"); }}
                      >
                        Sao chép
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {hashtags.map((tag) => (
                      <span
                        key={tag}
                        onClick={() => { navigator.clipboard.writeText(tag); }}
                        className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full cursor-pointer hover:bg-brand-100 transition-colors"
                        title="Click để sao chép"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    className="text-xs text-brand-600 hover:underline"
                    onClick={() => { navigator.clipboard.writeText(hashtags.join(" ")); success("Đã sao chép tất cả hashtags"); }}
                  >
                    Sao chép tất cả
                  </button>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      {/* Project meta */}
      <Card className="mt-6">
        <CardBody>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Chi tiết dự án</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["Nền tảng", { tiktok: "TikTok", facebook: "Facebook Reels", instagram: "Instagram Reels", youtube_shorts: "YouTube Shorts" }[project.platform] ?? project.platform],
              ["Loại video", { product_review: "Review sản phẩm", affiliate: "Affiliate", used_car: "Ô tô cũ", virtual_kol: "KOL ảo", b_roll: "B-roll" }[project.videoType] ?? project.videoType],
              ["Thời lượng", `${project.durationSeconds}s`],
              ["Chất lượng", { cheap: "Tiết kiệm", balanced: "Cân bằng", premium: "Premium" }[project.qualityPreset] ?? project.qualityPreset],
              ["Ngôn ngữ", project.language.toUpperCase()],
              ["ID", project.id.slice(-8)],
              ["Tạo lúc", (() => { const d = new Date(project.createdAt); const diff = Date.now() - d.getTime(); const h = Math.floor(diff / 3600000); return h < 24 ? `${h} giờ trước` : d.toLocaleDateString("vi-VN"); })()],
              ["Cập nhật", (() => { const d = new Date(project.updatedAt); const diff = Date.now() - d.getTime(); const h = Math.floor(diff / 3600000); return h < 24 ? `${h} giờ trước` : d.toLocaleDateString("vi-VN"); })()],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-gray-500 text-xs">{label}</dt>
                <dd className="text-gray-800 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          {/* Editable brand tone */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <dt className="text-gray-500 text-xs mb-1">Tone thương hiệu</dt>
            <dd>
              <InlineEdit
                value={(project as any).brandTone ?? ""}
                placeholder="Nhập phong cách thương hiệu..."
                onSave={async (brandTone) => {
                  await fetch(`/api/video-projects/${project.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
                    body: JSON.stringify({ brandTone }),
                  });
                  await refresh();
                  success("Đã cập nhật tone thương hiệu");
                }}
              />
            </dd>
          </div>
        </CardBody>
      </Card>

      {/* Personal notes */}
      <Card className="mt-4">
        <CardBody>
          <ProjectNotes projectId={project.id} />
        </CardBody>
      </Card>

      {/* Cost breakdown */}
      {project.costTracking && (
        <Card className="mt-4">
          <CardBody>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Chi phí AI</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                ["LLM (kịch bản)", project.costTracking.llmCostUsd],
                ["TTS (giọng nói)", project.costTracking.ttsCostUsd],
                ["Kling (video)", project.costTracking.videoCostUsd],
                ["Subtitle (Whisper)", project.costTracking.subtitleCostUsd],
              ].map(([label, val]) => (
                <div key={label}>
                  <dt className="text-gray-500 text-xs">{label}</dt>
                  <dd className="text-gray-800 font-medium">${Number(val).toFixed(4)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-600">Tổng chi phí</span>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">${Number(project.costTracking.totalCostUsd).toFixed(4)}</div>
                {project.durationSeconds > 0 && (
                  <div className="text-xs text-gray-400">~${(Number(project.costTracking.totalCostUsd) / project.durationSeconds).toFixed(5)}/giây</div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
