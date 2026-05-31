import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";

    const product = await prisma.product.findFirst({
      where: { id: params.id, userId },
      select: { id: true, name: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [total, statusGroups, costAgg, recentProjects] = await Promise.all([
      prisma.videoProject.count({ where: { productId: params.id } }),
      prisma.videoProject.groupBy({
        by: ["status"],
        where: { productId: params.id },
        _count: { id: true },
      }),
      prisma.costTracking.aggregate({
        where: { project: { productId: params.id } },
        _sum: { totalCostUsd: true },
        _avg: { totalCostUsd: true },
      }),
      prisma.videoProject.findMany({
        where: { productId: params.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, createdAt: true, platform: true },
      }),
    ]);

    const byStatus = Object.fromEntries(statusGroups.map((s) => [s.status, s._count.id]));

    return NextResponse.json({
      productId: params.id,
      productName: product.name,
      totalProjects: total,
      published: byStatus["published"] ?? 0,
      failed: byStatus["failed"] ?? 0,
      byStatus,
      totalSpentUsd: costAgg._sum.totalCostUsd?.toString() ?? "0",
      avgCostPerVideoUsd: costAgg._avg.totalCostUsd?.toString() ?? "0",
      recentProjects,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
