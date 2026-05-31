"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FailedJob {
  queue: string;
  jobId: string;
  name: string;
  data: unknown;
  failedReason: string;
  attemptsMade: number;
  finishedOn: number | null;
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/failed-jobs");
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRetry(queue: string, jobId: string) {
    const key = `${queue}:${jobId}`;
    setRetrying(key);
    try {
      await fetch(`/api/admin/jobs/${queue}/${jobId}/retry`, { method: "POST" });
      await load();
    } finally {
      setRetrying(null);
    }
  }

  async function handleClearAll() {
    if (!confirm("Xóa tất cả failed jobs?")) return;
    setClearing(true);
    try {
      await fetch("/api/admin/failed-jobs", { method: "DELETE" });
      await load();
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin — Failed Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">{jobs.length} job thất bại trong queue</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-brand-600 hover:underline">← Dashboard</Link>
          {jobs.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="text-sm text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50"
            >
              {clearing ? "Đang xóa..." : "Xóa tất cả"}
            </button>
          )}
          <button
            onClick={load}
            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            ↻ Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Đang tải...</p>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-600">Không có job nào thất bại!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const key = `${job.queue}:${job.jobId}`;
            const projectId = (job.data as any)?.projectId;
            return (
              <div key={key} className="bg-white rounded-xl border border-red-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {job.queue}
                      </span>
                      <span className="text-xs text-gray-500">#{job.jobId}</span>
                      <span className="text-xs text-gray-400">{job.attemptsMade} lần thử</span>
                      {job.finishedOn && (
                        <span className="text-xs text-gray-400">
                          {new Date(job.finishedOn).toLocaleTimeString("vi-VN")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-red-700 font-medium truncate">{job.failedReason}</p>
                    {projectId && (
                      <Link href={`/projects/${projectId}`} className="text-xs text-brand-600 hover:underline">
                        Project: {projectId.slice(-8)}
                      </Link>
                    )}
                  </div>
                  <button
                    onClick={() => handleRetry(job.queue, job.jobId)}
                    disabled={retrying === key}
                    className="text-xs text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 whitespace-nowrap"
                  >
                    {retrying === key ? "..." : "↺ Retry"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
