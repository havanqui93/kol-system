import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { cacheOrFetch, CacheKeys, cacheDel } from "@/lib/cache";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";

  const stats = await cacheOrFetch(
    CacheKeys.projectStats(userId),
    30, // 30s TTL
    async () => {
      const [statusCounts, platformCounts, costAggregate, recentFailures] = await Promise.all([
        prisma.videoProject.groupBy({
          by: ["status"],
          where: { userId, archivedAt: null },
          _count: { id: true },
        }),
        prisma.videoProject.groupBy({
          by: ["platform"],
          where: { userId, archivedAt: null },
          _count: { id: true },
        }),
        prisma.costTracking.aggregate({
          where: { userId },
          _sum: { totalCostUsd: true },
          _avg: { totalCostUsd: true },
          _count: { id: true },
        }),
        prisma.videoProject.count({
          where: {
            userId,
            status: "failed",
            updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      const byStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count.id]));
      const byPlatform = Object.fromEntries(platformCounts.map((p) => [p.platform, p._count.id]));

      const total = statusCounts.reduce((s, r) => s + r._count.id, 0);
      const done = statusCounts.find((s) => s.status === "published")?._count.id ?? 0;
      const processing = ["script_generating", "audio_generating", "video_generating", "rendering", "publishing"]
        .reduce((s, st) => s + (byStatus[st] ?? 0), 0);
      const failed = byStatus["failed"] ?? 0;

      return {
        total,
        done,
        processing,
        failed,
        byStatus,
        byPlatform,
        recentFailures24h: recentFailures,
        totalSpentUsd: costAggregate._sum.totalCostUsd?.toString() ?? "0",
        avgCostPerVideoUsd: costAggregate._avg.totalCostUsd?.toString() ?? "0",
      };
    }
  );

  return NextResponse.json(stats);
}
