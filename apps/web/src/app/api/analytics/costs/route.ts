import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

export const dynamic = "force-dynamic";

// GET /api/analytics/costs — cost breakdown over time for the current user
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const url = new URL(request.url);
  const days = Math.min(Number(url.searchParams.get("days") ?? "30"), 90);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [usageRecords, costSummary] = await Promise.all([
    prisma.providerUsage.groupBy({
      by: ["provider", "providerType"],
      where: { userId, createdAt: { gte: since } },
      _sum: { costUsd: true },
      _count: { id: true },
      orderBy: { _sum: { costUsd: "desc" } },
    }),
    prisma.costTracking.aggregate({
      where: { userId },
      _sum: {
        llmCostUsd: true,
        ttsCostUsd: true,
        videoCostUsd: true,
        subtitleCostUsd: true,
        storageCostUsd: true,
        totalCostUsd: true,
      },
    }),
  ]);

  const byProvider = usageRecords.map((r) => ({
    provider: r.provider,
    providerType: r.providerType,
    totalCostUsd: Number(r._sum.costUsd ?? 0),
    callCount: r._count.id,
  }));

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    byProvider,
    allTime: {
      llmCostUsd: Number(costSummary._sum.llmCostUsd ?? 0),
      ttsCostUsd: Number(costSummary._sum.ttsCostUsd ?? 0),
      videoCostUsd: Number(costSummary._sum.videoCostUsd ?? 0),
      subtitleCostUsd: Number(costSummary._sum.subtitleCostUsd ?? 0),
      storageCostUsd: Number(costSummary._sum.storageCostUsd ?? 0),
      totalCostUsd: Number(costSummary._sum.totalCostUsd ?? 0),
    },
  });
}
