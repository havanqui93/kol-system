"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ActivityEvent {
  at: string;
  event: string;
  detail?: string;
}

const EVENT_ICONS: Record<string, string> = {
  script_generated: "📝",
  script_approved: "✅",
  audio_generated: "🎙️",
  video_generated: "🎬",
  rendered: "🎞️",
  published: "📣",
  failed: "❌",
  archived: "📦",
  notes_updated: "📋",
  title_updated: "✏️",
};

export default function ProjectActivityPage({ params }: { params: { id: string } }) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/video-projects/${params.id}/activity`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lịch sử hoạt động</h1>
          <p className="text-sm text-gray-500 mt-0.5">{events.length} sự kiện gần đây</p>
        </div>
        <Link href={`/projects/${params.id}`} className="text-sm text-brand-600 hover:underline">
          ← Quay lại project
        </Link>
      </div>

      {loading ? (
        <p className="text-center py-12 text-gray-400">Đang tải...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500">Chưa có hoạt động nào được ghi lại</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-4 pl-12">
            {events.map((ev, i) => {
              const icon = EVENT_ICONS[ev.event] ?? "•";
              return (
                <div key={i} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-7 top-1 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-sm">
                    {icon}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-medium text-gray-800 capitalize">
                          {ev.event.replace(/_/g, " ")}
                        </span>
                        {ev.detail && (
                          <p className="text-xs text-gray-500 mt-0.5">{ev.detail}</p>
                        )}
                      </div>
                      <time className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(ev.at).toLocaleString("vi-VN", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
