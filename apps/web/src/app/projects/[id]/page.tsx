"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProject } from "@/hooks/use-project";
import { api } from "@/lib/api/client";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { ScriptViewer } from "@/components/project/script-viewer";
import { PipelineStep } from "@/components/project/pipeline-step";
import { PublishPanel } from "@/components/project/publish-panel";

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
  const { project, loading, error, refresh } = useProject(params.id);
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [voiceStyle, setVoiceStyle] = useState("energetic");
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function doAction(key: string, fn: () => Promise<unknown>) {
    setActionLoading(key);
    setActionError(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <PageSpinner />;
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
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/" className="hover:text-gray-700">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-700 truncate max-w-xs">{project.title ?? `Video ${params.id.slice(-6)}`}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {project.title ?? `Video ${params.id.slice(-6)}`}
            </h1>
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/video-projects/${project.id}/export`}
            download
            className="inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 text-xs px-3 py-1.5 bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-400"
          >
            ⬇ Export
          </a>
          <Button
            variant="outline"
            size="sm"
            loading={duplicating}
            onClick={async () => {
              setDuplicating(true);
              try {
                const clone = await api.projects.duplicate(project.id);
                router.push(`/projects/${clone.id}`);
              } finally {
                setDuplicating(false);
              }
            }}
          >
            Nhân bản
          </Button>
          {["script_generating", "audio_generating", "video_generating", "rendering", "publishing"].includes(status) && (
            <Button
              variant="danger"
              size="sm"
              loading={cancelling}
              onClick={async () => {
                if (!confirm("Bạn có chắc muốn hủy quá trình xử lý?")) return;
                setCancelling(true);
                try {
                  await fetch(`/api/video-projects/${project.id}/cancel`, {
                    method: "POST",
                    headers: { "x-user-id": "demo-user" },
                  });
                  await refresh();
                } finally {
                  setCancelling(false);
                }
              }}
            >
              Hủy
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            loading={archiving}
            onClick={async () => {
              const isArchived = !!(project as any).archivedAt;
              if (!isArchived && !confirm("Lưu trữ project này? Nó sẽ không hiện trên Dashboard nữa.")) return;
              setArchiving(true);
              try {
                await fetch(`/api/video-projects/${project.id}/archive`, {
                  method: isArchived ? "DELETE" : "POST",
                  headers: { "x-user-id": "demo-user" },
                });
                if (!isArchived) router.push("/");
                else await refresh();
              } finally {
                setArchiving(false);
              }
            }}
          >
            {(project as any).archivedAt ? "Khôi phục" : "Lưu trữ"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refresh()}>
            ↻ Làm mới
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {(project.errorMessage || actionError) && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {actionError ?? project.errorMessage}
        </div>
      )}

      {/* Final video preview (shown at top when available) */}
      {finalVideo && (
        <Card className="mb-6 border-green-200">
          <CardBody>
            <div className="flex items-start gap-4">
              <video
                src={finalVideo}
                controls
                className="w-36 rounded-lg bg-black"
                style={{ aspectRatio: "9/16" }}
              />
              <div className="flex-1">
                <div className="text-green-700 font-semibold text-sm mb-1">✓ Video đã sẵn sàng!</div>
                <p className="text-xs text-gray-500 mb-3">Video của bạn đã được render thành công.</p>
                <a href={finalVideo} download>
                  <Button size="sm">⬇ Tải xuống MP4</Button>
                </a>
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
              onClick={() => doAction("script", () => api.script.generate(project.id))}
            >
              Tạo kịch bản
            </Button>
          )}

          {status === "script_generating" && (
            <p className="text-xs text-brand-700 animate-pulse">Đang phân tích sản phẩm và viết kịch bản...</p>
          )}

          {project.scripts.length > 0 && status !== "script_generating" && (
            <ScriptViewer
              scripts={project.scripts}
              disabled={!!approvedScript || actionLoading !== null}
              onApprove={(scriptId) =>
                doAction("approve", () => api.script.approve(project.id, scriptId))
              }
              onRegenerate={
                !approvedScript
                  ? (feedback) => doAction("script", () => api.script.regenerate(project.id, feedback))
                  : undefined
              }
            />
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
                    api.audio.generate(project.id, { voiceGender: "female", voiceStyle: voiceStyle as any })
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
              onClick={() => doAction("kling", () => api.kling.generate(project.id))}
            >
              Tạo Kling clips
            </Button>
          )}

          {status === "video_generating" && (
            <p className="text-xs text-brand-700 animate-pulse">Đang tạo clip avatar/product bằng Kling...</p>
          )}

          {project.scenes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                {videoClipAssets.length} clip đã tạo / {project.scenes.filter((s) => s.status !== "completed" || s.clipUrl).length || project.scenes.length} cảnh
              </p>
              <div className="grid grid-cols-2 gap-2">
                {project.scenes.slice(0, 4).map((scene) => (
                  <div key={scene.id} className="rounded-lg border border-gray-200 px-3 py-2 text-xs">
                    <div className="font-medium text-gray-700">Scene {scene.sceneIndex}: {scene.visualType}</div>
                    <div className={scene.status === "completed" ? "text-green-700" : "text-gray-500"}>{scene.status}</div>
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
                    await api.render.start(project.id, { backgroundMusicUrl: musicUpload?.url });
                  })
                }
              >
                Bắt đầu render
              </Button>
            </div>
          )}

          {status === "rendering" && (
            <p className="text-xs text-brand-700 animate-pulse">Đang render video, vui lòng chờ...</p>
          )}

          {finalVideo && renderStep === "done" && (
            <p className="text-xs text-green-700">Video đã render thành công ↑</p>
          )}
        </PipelineStep>

        {/* Step 4: Publish */}
        {finalVideo && (
          <PublishPanel
            projectId={project.id}
            disabled={actionLoading !== null}
            platform={project.platform}
            videoType={project.videoType}
          />
        )}
      </div>

      {/* Project meta */}
      <Card className="mt-6">
        <CardBody>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Chi tiết dự án</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["Nền tảng", project.platform],
              ["Loại video", project.videoType],
              ["Thời lượng", `${project.durationSeconds}s`],
              ["Preset", project.qualityPreset],
              ["Ngôn ngữ", project.language.toUpperCase()],
              ["ID", project.id.slice(-8)],
              ["Tạo lúc", new Date(project.createdAt).toLocaleDateString("vi-VN")],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-gray-500 text-xs">{label}</dt>
                <dd className="text-gray-800 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      {/* Cost breakdown */}
      {project.costTracking && project.costTracking.length > 0 && (() => {
        const cost = project.costTracking[0];
        const total = parseFloat(cost.totalCostUsd);
        const budget = cost.budgetLimitUsd ? parseFloat(cost.budgetLimitUsd) : null;
        const items = [
          { label: "LLM (Claude/GPT)", value: parseFloat(cost.llmCostUsd) },
          { label: "TTS (ElevenLabs)", value: parseFloat(cost.ttsCostUsd) },
          { label: "Video (Kling)", value: parseFloat(cost.videoCostUsd) },
          { label: "Subtitle (Whisper)", value: parseFloat(cost.subtitleCostUsd) },
          { label: "Storage (R2)", value: parseFloat(cost.storageCostUsd) },
        ].filter((item) => item.value > 0);

        return (
          <Card className="mt-4">
            <CardBody>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chi phí</h3>
                <span className="font-semibold text-gray-800 text-sm">
                  ${total.toFixed(4)}
                  {budget && (
                    <span className="text-gray-400 font-normal"> / ${budget.toFixed(2)}</span>
                  )}
                </span>
              </div>
              {budget && (
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${total / budget > 0.8 ? "bg-red-500" : "bg-brand-500"}`}
                      style={{ width: `${Math.min(100, (total / budget) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{Math.round((total / budget) * 100)}% ngân sách đã dùng</p>
                </div>
              )}
              {items.length > 0 && (
                <dl className="space-y-1.5">
                  {items.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <dt className="text-gray-500">{label}</dt>
                      <dd className="text-gray-700 font-medium">${value.toFixed(4)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardBody>
          </Card>
        );
      })()}

      {/* Notes editor */}
      <NotesEditor projectId={project.id} initialNotes={(project as any).notes ?? ""} />
    </div>
  );
}

function NotesEditor({ projectId, initialNotes }: { projectId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/video-projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-user-id": "demo-user" },
        body: JSON.stringify({ notes }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardBody>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ghi chú</h3>
          {saved && <span className="text-xs text-green-600">✓ Đã lưu</span>}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Thêm ghi chú cho project này..."
          rows={3}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="secondary" loading={saving} onClick={save}>
            Lưu ghi chú
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
