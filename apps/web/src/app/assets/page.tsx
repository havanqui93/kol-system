"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const ASSET_TYPES = [
  { value: "", label: "Tất cả" },
  { value: "audio", label: "Audio" },
  { value: "video_clip", label: "Video clip" },
  { value: "image", label: "Hình ảnh" },
  { value: "final_video", label: "Video cuối" },
];

interface Asset {
  id: string;
  assetType: string;
  url: string;
  mimeType: string | null;
  sizeBytes: string | null;
  durationMs: number | null;
  createdAt: string;
  project: { id: string; title: string };
}

function formatBytes(bytes: bigint | string | null) {
  if (!bytes) return "";
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(ms: number | null) {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m${s % 60}s` : `${s}s`;
}

function AssetCard({ asset }: { asset: Asset }) {
  const isVideo = asset.assetType === "video_clip" || asset.assetType === "final_video";
  const isAudio = asset.assetType === "audio";
  const isImage = asset.assetType === "image";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 h-40 flex items-center justify-center relative">
        {isVideo && (
          <video
            src={asset.url}
            className="h-full w-full object-cover"
            preload="metadata"
            muted
          />
        )}
        {isAudio && (
          <div className="flex flex-col items-center gap-2 px-4 w-full">
            <span className="text-3xl">🎵</span>
            <audio src={asset.url} controls className="w-full h-8" preload="none" />
          </div>
        )}
        {isImage && (
          <img src={asset.url} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        {!isVideo && !isAudio && !isImage && (
          <span className="text-3xl">📄</span>
        )}
        <span className="absolute top-2 right-2 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded capitalize">
          {asset.assetType.replace("_", " ")}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <Link
          href={`/projects/${asset.project.id}`}
          className="text-xs font-medium text-brand-600 hover:underline truncate block"
        >
          {asset.project.title}
        </Link>
        <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
          <span>{new Date(asset.createdAt).toLocaleDateString("vi-VN")}</span>
          <span className="flex items-center gap-2">
            {formatDuration(asset.durationMs)}
            {formatBytes(asset.sizeBytes)}
          </span>
        </div>
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block text-center text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg py-1 hover:bg-gray-50"
        >
          Mở ↗
        </a>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/assets?type=${type}&page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setAssets(d.assets ?? []);
        setTotal(d.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [type, page]);

  function handleTypeChange(t: string) {
    setType(t);
    setPage(1);
  }

  const pageSize = 24;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thư viện assets</h1>
          <p className="text-sm text-gray-500 mt-1">{total} file được tạo ra</p>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {ASSET_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTypeChange(t.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              type === t.value
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500">Chưa có asset nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {assets.map((a) => <AssetCard key={a.id} asset={a} />)}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                ← Trước
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Tiếp →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
