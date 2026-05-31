import { prisma } from "@kol/database";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DAYS = 30;

export default async function AdminAnalyticsPage() {
  const since = new Date(Date.now() - DAYS * 86_400_000);

  const [projectStats, publishStats, costStats, providerStats] = await Promise.all([
    // Project creation funnel
    prisma.$queryRaw<Array<{ status: string; count: number }>>`
      SELECT status::text, COUNT(*)::int AS count
      FROM video_projects
      WHERE created_at >= ${since}
      GROUP BY status
      ORDER BY count DESC
    `,
    // Publish rate
    prisma.publishJob.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    }),
    // Total cost last 30 days
    prisma.costTracking.aggregate({
      _sum: { totalCostUsd: true, llmCostUsd: true, ttsCostUsd: true, videoCostUsd: true },
      where: { project: { createdAt: { gte: since } } },
    }),
    // Top providers by cost
    prisma.providerUsage.groupBy({
      by: ["provider"],
      where: { createdAt: { gte: since } },
      _sum: { costUsd: true },
      _count: { id: true },
      orderBy: { _sum: { costUsd: "desc" } },
    }),
  ]);

  const totalProjects = projectStats.reduce((s, r) => s + r.count, 0);
  const publishedCount = publishStats.find((s) => s.status === "published")?._count.id ?? 0;
  const failedPublish = publishStats.find((s) => s.status === "failed")?._count.id ?? 0;
  const totalCost = Number(costStats._sum.totalCostUsd ?? 0);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin — Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">30 ngày qua</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/costs" className="text-sm text-brand-600 hover:underline">Chi phí chi tiết →</Link>
          <Link href="/" className="text-sm text-gray-500 hover:underline">← Dashboard</Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Projects tạo ra", value: totalProjects },
          { label: "Bài đã đăng", value: publishedCount },
          { label: "Đăng thất bại", value: failedPublish },
          { label: "Tổng chi phí", value: `$${totalCost.toFixed(3)}` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Project funnel */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Trạng thái project</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {projectStats.map((row) => (
            <div key={row.status} className="px-5 py-3 flex items-center justify-between text-sm">
              <span className="text-gray-700 capitalize">{row.status.replace(/_/g, " ")}</span>
              <div className="flex items-center gap-4">
                <div className="w-32 bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-brand-500"
                    style={{ width: totalProjects > 0 ? `${Math.round((row.count / totalProjects) * 100)}%` : "0%" }}
                  />
                </div>
                <span className="font-semibold text-gray-900 w-8 text-right">{row.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider cost breakdown */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Chi phí theo provider</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {providerStats.map((row) => (
            <div key={row.provider} className="px-5 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-gray-800 capitalize">{row.provider}</span>
                <span className="ml-2 text-xs text-gray-400">{row._count.id} lần gọi</span>
              </div>
              <span className="font-semibold text-gray-900">${Number(row._sum.costUsd ?? 0).toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "LLM (Claude)", value: Number(costStats._sum.llmCostUsd ?? 0) },
          { label: "TTS (ElevenLabs)", value: Number(costStats._sum.ttsCostUsd ?? 0) },
          { label: "Video (Kling)", value: Number(costStats._sum.videoCostUsd ?? 0) },
          { label: "Tổng", value: totalCost },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <div className="text-xl font-bold text-gray-900">${item.value.toFixed(4)}</div>
            <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
