"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { api, type Scene, type MotionPoint } from "@/lib/api/client";

interface Props {
  projectId: string;
  scene: Scene;
  sourceImageUrl: string;
  onClose: () => void;
  onSaved: () => void;
}

type Mode = "brush" | "path";

// Cap the working resolution so big product photos stay responsive.
const MAX_DIM = 768;

export function MotionControlEditor({ projectId, scene, sourceImageUrl, onClose, onSaved }: Props) {
  const displayRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null); // offscreen: white strokes = moving region
  const imgRef = useRef<HTMLImageElement | null>(null);
  const paintingRef = useRef(false);

  const [mode, setMode] = useState<Mode>("brush");
  const [brushSize, setBrushSize] = useState(40);
  const [trajectory, setTrajectory] = useState<MotionPoint[]>([]);
  const [hasPaint, setHasPaint] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redraw the visible canvas: source image + mask overlay + trajectory.
  const redraw = useCallback(() => {
    const display = displayRef.current;
    const mask = maskRef.current;
    const img = imgRef.current;
    if (!display || !mask || !img) return;
    const ctx = display.getContext("2d");
    if (!ctx) return;
    const { width: w, height: h } = display;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    // Translucent tint over the painted (moving) region.
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.drawImage(mask, 0, 0);
    ctx.restore();

    // Trajectory polyline + points.
    if (trajectory.length > 0) {
      ctx.save();
      ctx.strokeStyle = "#22d3ee";
      ctx.fillStyle = "#06b6d4";
      ctx.lineWidth = 3;
      ctx.beginPath();
      trajectory.forEach((p, i) => {
        const x = p.x * w;
        const y = p.y * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      trajectory.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, i === 0 ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }, [trajectory]);

  // Load the source image and size both canvases to its (capped) dimensions.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale) || MAX_DIM;
      const h = Math.round(img.naturalHeight * scale) || MAX_DIM;
      imgRef.current = img;
      for (const c of [displayRef.current, maskRef.current]) {
        if (c) {
          c.width = w;
          c.height = h;
        }
      }
      setReady(true);
    };
    img.onerror = () => setError("Không tải được ảnh nguồn");
    img.src = sourceImageUrl;
  }, [sourceImageUrl]);

  useEffect(() => {
    if (ready) redraw();
  }, [ready, redraw]);

  function toCanvasCoords(e: React.PointerEvent<HTMLCanvasElement>) {
    const display = displayRef.current!;
    const rect = display.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * display.width;
    const y = ((e.clientY - rect.top) / rect.height) * display.height;
    return { x, y };
  }

  function paintAt(x: number, y: number) {
    const mask = maskRef.current;
    if (!mask) return;
    const ctx = mask.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    if (!hasPaint) setHasPaint(true);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!ready) return;
    const { x, y } = toCanvasCoords(e);
    if (mode === "brush") {
      paintingRef.current = true;
      paintAt(x, y);
      redraw();
    } else {
      const display = displayRef.current!;
      setTrajectory((prev) => [...prev, { x: x / display.width, y: y / display.height }]);
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== "brush" || !paintingRef.current) return;
    const { x, y } = toCanvasCoords(e);
    paintAt(x, y);
    redraw();
  }

  function endStroke() {
    paintingRef.current = false;
  }

  function clearMask() {
    const mask = maskRef.current;
    if (mask) mask.getContext("2d")?.clearRect(0, 0, mask.width, mask.height);
    setHasPaint(false);
    setTrajectory([]);
    redraw();
  }

  function undoPoint() {
    setTrajectory((prev) => prev.slice(0, -1));
  }

  // Composite the white strokes onto a black background → Kling motion mask.
  function exportMask(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const mask = maskRef.current;
      if (!mask) return resolve(null);
      const out = document.createElement("canvas");
      out.width = mask.width;
      out.height = mask.height;
      const ctx = out.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(mask, 0, 0);
      out.toBlob((b) => resolve(b), "image/png");
    });
  }

  async function handleSave() {
    setError(null);
    if (!hasPaint) {
      setError("Hãy tô vùng cần chuyển động (chế độ Cọ).");
      return;
    }
    if (trajectory.length < 2) {
      setError("Hãy thêm ít nhất 2 điểm cho quỹ đạo (chế độ Quỹ đạo).");
      return;
    }
    setSaving(true);
    try {
      const blob = await exportMask();
      if (!blob) throw new Error("Không tạo được mask");
      const file = new File([blob], `mask-scene-${scene.sceneIndex}.png`, { type: "image/png" });
      const { url } = await api.uploads.file(file, "asset");
      await api.scenes.updateMotion(projectId, scene.id, {
        motionBrushes: [{ maskUrl: url, trajectory }],
        regenerate: true,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <div>
            <h3 className="font-semibold text-gray-900">Motion Control · Cảnh {scene.sceneIndex}</h3>
            <p className="text-xs text-gray-500">Tô vùng chuyển động, rồi vẽ quỹ đạo di chuyển</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
              <button
                onClick={() => setMode("brush")}
                className={`px-3 py-1.5 text-sm rounded-md ${mode === "brush" ? "bg-brand-600 text-white" : "text-gray-600"}`}
              >
                🖌️ Cọ (vùng động)
              </button>
              <button
                onClick={() => setMode("path")}
                className={`px-3 py-1.5 text-sm rounded-md ${mode === "path" ? "bg-brand-600 text-white" : "text-gray-600"}`}
              >
                📈 Quỹ đạo
              </button>
            </div>

            {mode === "brush" && (
              <label className="flex items-center gap-2 text-xs text-gray-500">
                Cỡ cọ
                <input
                  type="range"
                  min={10}
                  max={120}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
              </label>
            )}

            {mode === "path" && trajectory.length > 0 && (
              <button onClick={undoPoint} className="text-xs text-gray-500 hover:text-gray-700 underline">
                Hoàn tác điểm
              </button>
            )}
            <button onClick={clearMask} className="text-xs text-red-500 hover:text-red-700 underline ml-auto">
              Xóa hết
            </button>
          </div>

          {/* Canvas */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900 flex items-center justify-center">
            {!ready && <div className="py-20 text-gray-400 text-sm">Đang tải ảnh...</div>}
            <canvas
              ref={displayRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endStroke}
              onPointerLeave={endStroke}
              className={`max-w-full touch-none ${ready ? "" : "hidden"} ${mode === "path" ? "cursor-crosshair" : "cursor-pointer"}`}
              style={{ maxHeight: "50vh" }}
            />
            {/* offscreen mask canvas */}
            <canvas ref={maskRef} className="hidden" />
          </div>

          <p className="text-xs text-gray-500">
            Vùng tô màu sẽ chuyển động theo quỹ đạo; phần còn lại giữ ổn định. Mask được lưu và Kling sẽ tạo lại clip cảnh này.
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} loading={saving} className="flex-1">
              Lưu & tạo lại clip
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
