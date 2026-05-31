import { prisma } from "@kol/database";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PLATFORM_META: Record<string, { icon: string; name: string }> = {
  tiktok: { icon: "🎵", name: "TikTok" },
  facebook: { icon: "📘", name: "Facebook" },
  youtube_shorts: { icon: "▶️", name: "YouTube" },
  instagram: { icon: "📸", name: "Instagram" },
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-50 border-yellow-200 text-yellow-800",
  publishing: "bg-blue-50 border-blue-200 text-blue-800",
  published: "bg-green-50 border-green-200 text-green-800",
  failed: "bg-red-50 border-red-200 text-red-800",
};

export default async function SchedulePage() {
  const jobs = await prisma.publishJob.findMany({
    where: {
      project: { userId: "demo-user" },
      scheduledAt: { not: null },
    },
    include: {
      project: { select: { id: true, title: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: 100,
  });

  // Group by date
  const byDate = new Map<string, typeof jobs>();
  for (const job of jobs) {
    if (!job.scheduledAt) continue;
    const day = job.scheduledAt.toISOString().slice(0, 10);
    if (!byDate.has(day)) byDate.set(day, []);
    byDate.get(day)!.push(job);
  }

  // Also get unscheduled (publish immediately) jobs from last 7 days
  const recent = await prisma.publishJob.findMany({
    where: {
      project: { userId: "demo-user" },
      scheduledAt: null,
      createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) },
    },
    include: { project: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Lịch đăng bài</h1>
        <p className="text-sm text-gray-500 mt-1">Theo dõi các bài đăng đã lên lịch</p>
      </div>

      {jobs.length === 0 && recent.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-gray-700">Chưa có bài đăng nào</h2>
          <p className="text-gray-500 mt-2">Tạo video và lên lịch đăng để xem ở đây</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scheduled jobs grouped by date */}
          {Array.from(byDate.entries()).map(([date, dayJobs]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {new Date(date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
              </h2>
              <div className="space-y-2">
                {dayJobs.map((job) => {
                  const meta = PLATFORM_META[job.platform] ?? { icon: "📱", name: job.platform };
                  const colorClass = STATUS_COLORS[job.status] ?? "bg-gray-50 border-gray-200 text-gray-800";
                  return (
                    <div
                      key={job.id}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${colorClass}`}
                    >
                      <span className="text-xl">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/projects/${job.project.id}`}
                          className="font-medium text-sm hover:underline truncate block"
                        >
                          {job.project.title ?? `Video ${job.project.id.slice(-6)}`}
                        </Link>
                        <div className="text-xs opacity-70">
                          {meta.name} · {job.scheduledAt?.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <span className="text-xs font-medium capitalize">{job.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Recent immediate publishes */}
          {recent.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Đăng ngay (7 ngày qua)
              </h2>
              <div className="space-y-2">
                {recent.map((job) => {
                  const meta = PLATFORM_META[job.platform] ?? { icon: "📱", name: job.platform };
                  const colorClass = STATUS_COLORS[job.status] ?? "bg-gray-50 border-gray-200 text-gray-800";
                  return (
                    <div
                      key={job.id}
                      className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${colorClass}`}
                    >
                      <span className="text-xl">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/projects/${job.project.id}`}
                          className="font-medium text-sm hover:underline truncate block"
                        >
                          {job.project.title ?? `Video ${job.project.id.slice(-6)}`}
                        </Link>
                        <div className="text-xs opacity-70">
                          {meta.name} · {new Date(job.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </div>
                      <span className="text-xs font-medium capitalize">{job.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
