import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { handleApiError } from "@/lib/api-error";

// Provider reliability analytics
export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";
    const { searchParams } = new URL(request.url);
    const days = Math.min(90, parseInt(searchParams.get("days") ?? "7", 10));

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const usages = await prisma.providerUsage.groupBy({
      by: ["provider", "providerType"],
      where: { userId, createdAt: { gte: since } },
      _count: { id: true },
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
      _avg: { costUsd: true },
    });

    const providers = usages.map((u) => ({
      provider: u.provider,
      providerType: u.providerType,
      callCount: u._count.id,
      totalCostUsd: u._sum.costUsd?.toString() ?? "0",
      avgCostUsd: u._avg.costUsd?.toString() ?? "0",
      totalInputTokens: u._sum.inputTokens ?? 0,
      totalOutputTokens: u._sum.outputTokens ?? 0,
    }));

    return NextResponse.json({ providers, period: { days } });
  } catch (err) {
    return handleApiError(err);
  }
}
