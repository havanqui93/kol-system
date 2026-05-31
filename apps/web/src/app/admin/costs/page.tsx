import { prisma } from "@kol/database";
import Link from "next/link";

export const dynamic = "force-dynamic";

const DAYS = 30;

async function getDailyBreakdown() {
  const since = new Date(Date.now() - DAYS * 86_400_000);

  const rows = await prisma.$queryRaw<
    Array<{
      day: Date;
      provider: string;
      provider_type: string;
      total_cost: number;
      call_count: number;
    }>
  >`
    SELECT
      DATE_TRUNC('day', created_at) AS day,
      provider,
      provider_type::text,
      SUM(cost_usd)::float AS total_cost,
      COUNT(*)::int AS call_count
    FROM provider_usage
    WHERE created_at >= ${since}
    GROUP BY 1, 2, 3
    ORDER BY 1 DESC, 4 DESC
  `;

  return rows;
}

async function getTotals() {
  const result = await prisma.$queryRaw<
    Array<{
      provider: string;
      total_cost: number;
      call_count: number;
    }>
  >`
    SELECT
      provider,
      SUM(cost_usd)::float AS total_cost,
      COUNT(*)::int AS call_count
    FROM provider_usage
    GROUP BY provider
    ORDER BY 2 DESC
  `;
  return result;
}

async function getProjectTopCosts() {
  return prisma.costTracking.findMany({
    orderBy: { totalCostUsd: "desc" },
    take: 10,
    include: { project: { select: { id: true, title: true, status: true, createdAt: true } } },
  });
}

export default async function AdminCostsPage() {
  const [daily, totals, topProjects] = await Promise.all([
    getDailyBreakdown(),
    getTotals(),
    getProjectTopCosts(),
  ]);

  const grandTotal = totals.reduce((sum, r) => sum + (r.total_cost ?? 0), 0);

  // Group daily rows by day for the table
  const byDay = new Map<string, typeof daily>();
  for (const row of daily) {
    const key = row.day.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(row);
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin — Chi phí AI</h1>
          <p className="text-sm text-gray-500 mt-1">Theo dõi chi phí API theo ngày và nhà cung cấp</p>
        </div>
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Dashboard</Link>
      </div>

      {/* Grand total */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <div className="text-2xl font-bold text-gray-900">${grandTotal.toFixed(4)}</div>
          <div className="text-xs text-gray-500 mt-0.5">Tổng tất cả</div>
        </div>
        {totals.slice(0, 3).map((r) => (
          <div key={r.provider} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
            <div className="text-2xl font-bold text-gray-900">${(r.total_cost ?? 0).toFixed(4)}</div>
            <div className="text-xs text-gray-500 mt-0.5 capitalize">{r.provider}</div>
            <div className="text-xs text-gray-400">{r.call_count} lần gọi</div>
          </div>
        ))}
      </div>

      {/* Top 10 projects by cost */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Top project tốn kém nhất</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {topProjects.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-500">Chưa có dữ liệu.</p>
          ) : (
            topProjects.map((ct) => (
              <div key={ct.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <Link
                    href={`/projects/${ct.project.id}`}
                    className="font-medium text-gray-800 hover:text-brand-600"
                  >
                    {ct.project.title ?? `Video ${ct.project.id.slice(-6)}`}
                  </Link>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {ct.project.status} · {new Date(ct.project.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${parseFloat(ct.totalCostUsd.toString()).toFixed(4)}
                  </div>
                  {ct.budgetLimitUsd && (
                    <div className="text-xs text-gray-400">
                      / ${parseFloat(ct.budgetLimitUsd.toString()).toFixed(2)} budget
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Daily breakdown table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Theo ngày (30 ngày qua)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Ngày</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Provider</th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Lần gọi</th>
                <th className="text-right px-5 py-2 text-xs font-semibold text-gray-500 uppercase">Chi phí</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {daily.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-4 text-gray-400 text-center">Chưa có dữ liệu</td>
                </tr>
              ) : (
                daily.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-2 text-gray-600 whitespace-nowrap">
                      {row.day.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-2 text-gray-700 capitalize">{row.provider}</td>
                    <td className="px-4 py-2 text-right text-gray-600">{row.call_count}</td>
                    <td className="px-5 py-2 text-right font-medium text-gray-900">
                      ${(row.total_cost ?? 0).toFixed(6)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
