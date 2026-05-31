import Link from "next/link";
import { prisma } from "@kol/database";
import { redis } from "@/lib/redis";
import { queues } from "@/lib/queues";

export const dynamic = "force-dynamic";

async function getSystemStatus() {
  const since30d = new Date(Date.now() - 30 * 86_400_000);

  const [dbPing, redisPing, workerKeys, projectCount, failedJobs, recentErrors] = await Promise.allSettled([
    (async () => { const t = Date.now(); await prisma.$queryRaw`SELECT 1`; return Date.now() - t; })(),
    (async () => { const t = Date.now(); await redis.ping(); return Date.now() - t; })(),
    redis.keys("worker:heartbeat:*"),
    prisma.videoProject.count({ where: { userId: "demo-user", archivedAt: null } }),
    queues.generateScript.getFailedCount(),
    prisma.videoProject.count({ where: { status: "failed", createdAt: { gte: since30d } } }),
  ]);

  return {
    db: dbPing.status === "fulfilled"
      ? { ok: true, latencyMs: dbPing.value }
      : { ok: false, error: String((dbPing as any).reason) },
    redis: redisPing.status === "fulfilled"
      ? { ok: true, latencyMs: redisPing.value }
      : { ok: false, error: String((redisPing as any).reason) },
    workers: workerKeys.status === "fulfilled" ? workerKeys.value.length : 0,
    projectCount: projectCount.status === "fulfilled" ? projectCount.value : 0,
    failedJobs: failedJobs.status === "fulfilled" ? failedJobs.value : 0,
    recentErrors: recentErrors.status === "fulfilled" ? recentErrors.value : 0,
    providers: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      fal: !!process.env.FAL_KEY,
      r2: !!process.env.R2_ACCESS_KEY_ID,
    },
  };
}

export default async function AdminStatusPage() {
  const status = await getSystemStatus();
  const allHealthy = status.db.ok && status.redis.ok && status.workers > 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin — System Status</h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className={`inline-flex items-center gap-1 font-medium ${allHealthy ? "text-green-600" : "text-yellow-600"}`}>
              <span className={`w-2 h-2 rounded-full ${allHealthy ? "bg-green-500" : "bg-yellow-400"}`} />
              {allHealthy ? "Tất cả hệ thống hoạt động bình thường" : "Có vấn đề cần chú ý"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/queues" className="text-sm text-brand-600 hover:underline">Queues →</Link>
          <Link href="/admin/workers" className="text-sm text-brand-600 hover:underline">Workers →</Link>
          <Link href="/" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
        </div>
      </div>

      {/* Infrastructure */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Database",
            ok: status.db.ok,
            detail: status.db.ok ? `${status.db.latencyMs}ms latency` : status.db.error,
          },
          {
            label: "Redis",
            ok: status.redis.ok,
            detail: status.redis.ok ? `${status.redis.latencyMs}ms latency` : status.redis.error,
          },
          {
            label: "Workers",
            ok: status.workers > 0,
            detail: `${status.workers} đang chạy`,
          },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${item.ok ? "bg-green-500" : "bg-red-500"}`} />
              <span className="font-semibold text-gray-800">{item.label}</span>
            </div>
            <p className="text-xs text-gray-500">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Tổng projects", value: status.projectCount },
          { label: "Script jobs thất bại", value: status.failedJobs, alert: status.failedJobs > 0 },
          { label: "Projects lỗi (30 ngày)", value: status.recentErrors, alert: status.recentErrors > 0 },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white rounded-xl border px-5 py-4 ${stat.alert ? "border-red-200" : "border-gray-200"}`}>
            <div className={`text-2xl font-bold ${stat.alert ? "text-red-600" : "text-gray-900"}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Provider keys */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">API Keys</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {Object.entries(status.providers).map(([key, configured]) => (
            <div key={key} className="px-5 py-3 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 capitalize">{key}</span>
              <span className={`text-xs font-medium ${configured ? "text-green-600" : "text-red-500"}`}>
                {configured ? "✓ Configured" : "✗ Missing"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/analytics", label: "Analytics" },
          { href: "/admin/costs", label: "Chi phí" },
          { href: "/admin/jobs", label: "Failed jobs" },
          { href: "/admin/archived", label: "Archived" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 text-center transition-colors"
          >
            {link.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
