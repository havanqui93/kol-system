import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const PAGE_SIZE = 24;

  const where: Record<string, unknown> = {
    project: { userId: "demo-user", archivedAt: null },
  };
  if (type) where.assetType = type;

  const [assets, total] = await Promise.all([
    prisma.generatedAsset.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        project: { select: { id: true, title: true } },
      },
    }),
    prisma.generatedAsset.count({ where: where as any }),
  ]);

  return NextResponse.json({ assets, total, page, pageSize: PAGE_SIZE });
}
