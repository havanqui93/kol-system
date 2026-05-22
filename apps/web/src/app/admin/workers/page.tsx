"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

interface HealthData {
  status: "ok" | "degraded";
  checks: Record<string, "ok" | "error">;
  queues: Record<string, number>;
  errors: string[];
  ts: string;
}

const QUEUE_LABELS: Record<string, string> = {
  script: "Kịch bản (LLM)",
  audio: "Giọng nói (TTS)",
  kling: "Video clips (Kling)",
  render: "Render video (FFmpeg)",
  publish: "Đăng bài (Social)",
};

export default function WorkersPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(manual = false) {
    if (manual) setRefreshing(true);
    try {
      const r = await fetch("/api/health");
      setHealth(await r.json());
      setLastRefreshed(new Date());
    } catch {}
    setLoading(false);
    if (manual) setRefreshing(false);
  }

  useEffect(() => {
    load();
    const id = setInterval(() => load(), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "r" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        load(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trạng thái Worker</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            {lastRefreshed ? `Cập nhật ${lastRefreshed.toLocaleTimeString("vi-VN")} · tự động mỗi 5s` : "Đang tải..."}
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/health`); }}
              title="Sao chép URL health check API"
              className="text-gray-300 hover:text-gray-500 transition-colors text-xs"
            >
              ⎘ /api/health
            </button>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {health && (
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(health, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `health-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              title="Tải xuống báo cáo health JSON"
            >
              ⬇ JSON
            </button>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            {refreshing ? "…" : "↻ Làm mới"}
          </button>
          {health && (
            <>
              {Object.values(health.queues).reduce((a, b) => a + b, 0) > 0 && (
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700">
                  {Object.values(health.queues).reduce((a, b) => a + b, 0)} job đang chờ
                </span>
              )}
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${health.status === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {health.status === "ok" ? "● Hoạt động tốt" : "● Sự cố"}
              </span>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      )}

      {health && (
        <div className="space-y-6">
          {/* Service status */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-800">Dịch vụ hạ tầng</h2></CardHeader>
            <CardBody className="divide-y divide-gray-100">
              {Object.entries(health.checks).map(([svc, status]) => (
                <div key={svc} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-medium text-gray-700 capitalize">{svc}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {status === "ok" ? "● Online" : "● Offline"}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Queue depths */}
          {health.queues && Object.keys(health.queues).length > 0 && (
            <Card>
              <CardHeader><h2 className="font-semibold text-gray-800">Hàng đợi BullMQ</h2></CardHeader>
              <CardBody className="divide-y divide-gray-100">
                {Object.entries(health.queues).map(([queue, count]) => (
                  <div key={queue} className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="text-sm font-medium text-gray-700">{QUEUE_LABELS[queue] ?? queue}</div>
                      <div className="text-xs text-gray-400 font-mono">{queue}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${count > 5 ? "bg-red-400" : count > 0 ? "bg-yellow-400" : "bg-green-400"}`}
                          style={{ width: `${Math.min(100, count * 10)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold min-w-[2.5rem] text-right ${count > 5 ? "text-red-600" : count > 0 ? "text-yellow-700" : "text-green-600"}`}>
                        {count < 0 ? "?" : count === 0 ? "trống" : `${count} job`}
                      </span>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {/* All clear */}
          {health.errors.length === 0 && health.status === "ok" && Object.values(health.queues).every((c) => c === 0) && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-semibold text-green-700">Hệ thống hoạt động tốt</p>
                <p className="text-xs text-green-600 mt-0.5">Không có lỗi · Tất cả hàng đợi trống · Tất cả dịch vụ online</p>
              </div>
            </div>
          )}

          {/* Errors */}
          {health.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-red-700 mb-2">Lỗi</h3>
              {health.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600 font-mono">{e}</p>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Server timestamp: {new Date(health.ts).toLocaleTimeString("vi-VN")}
          </p>
        </div>
      )}
    </div>
  );
}
