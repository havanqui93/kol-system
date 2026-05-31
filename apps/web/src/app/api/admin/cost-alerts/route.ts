import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { handleApiError } from "@/lib/api-error";

// Return projects that are approaching or exceeding their budget
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const threshold = parseFloat(searchParams.get("threshold") ?? "80");

    const trackings = await prisma.costTracking.findMany({
      where: { budgetLimitUsd: { not: null } },
      include: {
        project: {
          select: { id: true, title: true, status: true, userId: true },
        },
      },
      orderBy: { totalCostUsd: "desc" },
      take: 50,
    });

    const alerts = trackings
      .map((t) => {
        const total = parseFloat(String(t.totalCostUsd));
        const limit = parseFloat(String(t.budgetLimitUsd));
        const pct = limit > 0 ? (total / limit) * 100 : 0;
        return {
          projectId: t.projectId,
          projectTitle: t.project.title,
          projectStatus: t.project.status,
          totalCostUsd: total,
          budgetLimitUsd: limit,
          percentUsed: Math.round(pct),
          exceeded: total >= limit,
          nearLimit: pct >= threshold && total < limit,
        };
      })
      .filter((a) => a.percentUsed >= threshold)
      .sort((a, b) => b.percentUsed - a.percentUsed);

    return NextResponse.json({
      alerts,
      exceeded: alerts.filter((a) => a.exceeded).length,
      nearLimit: alerts.filter((a) => a.nearLimit).length,
      threshold,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
