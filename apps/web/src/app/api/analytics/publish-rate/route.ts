import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

export const dynamic = "force-dynamic";

// GET /api/analytics/publish-rate — publish success rate by platform
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const url = new URL(request.url);
  const days = Math.min(Number(url.searchParams.get("days") ?? "30"), 365);
  const since = new Date(Date.now() - days * 86_400_000);

  const jobs = await prisma.publishJob.groupBy({
    by: ["platform", "status"],
    where: {
      project: { userId },
      createdAt: { gte: since },
    },
    _count: { id: true },
  });

  // Aggregate by platform
  const byPlatform: Record<string, { total: number; published: number; failed: number; successRate: number }> = {};
  for (const row of jobs) {
    const p = row.platform;
    if (!byPlatform[p]) byPlatform[p] = { total: 0, published: 0, failed: 0, successRate: 0 };
    byPlatform[p].total += row._count.id;
    if (row.status === "published") byPlatform[p].published += row._count.id;
    if (row.status === "failed") byPlatform[p].failed += row._count.id;
  }

  for (const p of Object.values(byPlatform)) {
    p.successRate = p.total > 0 ? Math.round((p.published / p.total) * 100) : 0;
  }

  const overall = Object.values(byPlatform).reduce(
    (acc, p) => ({ total: acc.total + p.total, published: acc.published + p.published, failed: acc.failed + p.failed }),
    { total: 0, published: 0, failed: 0 }
  );

  return NextResponse.json({
    days,
    overall: {
      ...overall,
      successRate: overall.total > 0 ? Math.round((overall.published / overall.total) * 100) : 0,
    },
    byPlatform,
  });
}
