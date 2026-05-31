import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

export const dynamic = "force-dynamic";

// GET /api/analytics/tokens — token usage stats by model
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const url = new URL(request.url);
  const days = Math.min(Number(url.searchParams.get("days") ?? "30"), 365);
  const since = new Date(Date.now() - days * 86_400_000);

  const usage = await prisma.providerUsage.groupBy({
    by: ["provider", "model", "operation"],
    where: { userId, createdAt: { gte: since } },
    _sum: { inputTokens: true, outputTokens: true, costUsd: true },
    _count: { id: true },
    orderBy: { _sum: { costUsd: "desc" } },
  });

  const total = usage.reduce(
    (acc, u) => ({
      inputTokens: acc.inputTokens + (u._sum.inputTokens ?? 0),
      outputTokens: acc.outputTokens + (u._sum.outputTokens ?? 0),
      costUsd: acc.costUsd + Number(u._sum.costUsd ?? 0),
      calls: acc.calls + u._count.id,
    }),
    { inputTokens: 0, outputTokens: 0, costUsd: 0, calls: 0 }
  );

  return NextResponse.json({
    days,
    total,
    breakdown: usage.map((u) => ({
      provider: u.provider,
      model: u.model,
      operation: u.operation,
      calls: u._count.id,
      inputTokens: u._sum.inputTokens ?? 0,
      outputTokens: u._sum.outputTokens ?? 0,
      costUsd: Number(u._sum.costUsd ?? 0),
    })),
  });
}
