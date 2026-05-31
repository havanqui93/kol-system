"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Worker {
  workerId: string;
  workerType: string;
  version: string;
  ts: number;
  ttlSeconds: number;
}

function HealthBar({ ttl }: { ttl: number }) {
  const pct = Math.min(100, (ttl / 90) * 100);
  const color = pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-20 bg-gray-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    const res = await fetch("/api/workers/heartbeat");
    const d = await res.json();
    setWorkers(d.workers ?? []);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, []);

  const byType = workers.reduce<Record<string, Worker[]>>((acc, w) => {
    (acc[w.workerType] ??= []).push(w);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin — Workers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {workers.length} worker đang chạy · Tự động làm mới mỗi 15s
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs" className="text-sm text-brand-600 hover:underline">Failed jobs →</Link>
          <Link href="/" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-400 mb-4">
          Cập nhật lúc {lastUpdated.toLocaleTimeString("vi-VN")}
        </p>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-12">Đang tải...</p>
      ) : workers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">😴</div>
          <p className="text-gray-600 font-medium">Không có worker nào đang chạy</p>
          <p className="text-sm text-gray-400 mt-1">Worker sẽ xuất hiện khi ứng dụng worker được khởi động</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byType).map(([type, group]) => (
            <div key={type} className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 capitalize">{type}</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {group.length} instance
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {group.map((w) => (
                  <div key={w.workerId} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800 font-mono">{w.workerId.slice(-12)}</span>
                        {w.version && (
                          <span className="text-xs text-gray-400">v{w.version}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        Ping: {new Date(w.ts).toLocaleTimeString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <HealthBar ttl={w.ttlSeconds} />
                      <span className="text-xs text-gray-500 w-12 text-right">{w.ttlSeconds}s TTL</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
