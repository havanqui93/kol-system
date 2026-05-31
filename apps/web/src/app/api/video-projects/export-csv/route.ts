import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// GET /api/video-projects/export-csv — download all projects as CSV
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";

  const projects = await prisma.videoProject.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true } },
      kolProfile: { select: { name: true } },
      costTracking: { select: { totalCostUsd: true } },
    },
  });

  const headers = [
    "id",
    "title",
    "status",
    "platform",
    "videoType",
    "durationSeconds",
    "language",
    "qualityPreset",
    "product",
    "kolProfile",
    "totalCostUsd",
    "finalVideoUrl",
    "createdAt",
    "updatedAt",
  ];

  const rows = projects.map((p) => [
    p.id,
    p.title ?? "",
    p.status,
    p.platform,
    p.videoType,
    p.durationSeconds,
    p.language,
    p.qualityPreset,
    p.product?.name ?? "",
    p.kolProfile?.name ?? "",
    p.costTracking[0]?.totalCostUsd?.toString() ?? "0",
    p.finalVideoUrl ?? "",
    p.createdAt.toISOString(),
    p.updatedAt.toISOString(),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kol-projects-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
