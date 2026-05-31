"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface QueueStat {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export default function AdminQueuesPage() {
  const [stats, setStats] = useState<QueueStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    const res = await fetch("/api/admin/queue-stats");
    const d = await res.json();
    setStats(d.stats ?? []);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, []);

  const totalActive = stats.reduce((s, q) => s + q.active, 0);
  const totalWaiting = stats.reduce((s, q) => s + q.waiting, 0);
  const totalFailed = stats.reduce((s, q) => s + q.failed, 0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin — Queue Stats</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalActive} đang chạy · {totalWaiting} đang chờ · {totalFailed} thất bại
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/workers" className="text-sm text-brand-600 hover:underline">Workers →</Link>
          <Link href="/admin/jobs" className="text-sm text-brand-600 hover:underline">Failed jobs →</Link>
          <Link href="/" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-400 mb-4">
          Cập nhật lúc {lastUpdated.toLocaleTimeString("vi-VN")} · Tự động làm mới mỗi 10s
        </p>
      )}

      {loading ? (
        <p className="text-center py-12 text-gray-400">Đang tải...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-6 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <span className="col-span-2">Queue</span>
            <span className="text-center">Đang chạy</span>
            <span className="text-center">Chờ</span>
            <span className="text-center">Xong</span>
            <span className="text-center">Thất bại</span>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.map((q) => (
              <div key={q.name} className="grid grid-cols-6 px-5 py-3.5 items-center text-sm hover:bg-gray-50">
                <div className="col-span-2 flex items-center gap-2">
                  {q.active > 0 && (
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  )}
                  <span className="font-medium text-gray-800">{q.name}</span>
                  {q.delayed > 0 && (
                    <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full">
                      {q.delayed} delayed
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <span className={`font-semibold ${q.active > 0 ? "text-green-600" : "text-gray-300"}`}>
                    {q.active}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`font-semibold ${q.waiting > 0 ? "text-blue-600" : "text-gray-300"}`}>
                    {q.waiting}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-gray-500">{q.completed}</span>
                </div>
                <div className="text-center">
                  <span className={`font-semibold ${q.failed > 0 ? "text-red-600" : "text-gray-300"}`}>
                    {q.failed}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
