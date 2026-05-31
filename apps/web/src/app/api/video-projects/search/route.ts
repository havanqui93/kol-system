import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// GET /api/video-projects/search?q=... — full-text search across title + product name
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 50);

  if (!q) return NextResponse.json({ projects: [], total: 0 });

  const projects = await prisma.videoProject.findMany({
    where: {
      userId,
      archivedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { product: { description: { contains: q, mode: "insensitive" } } },
        { notes: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: {
      product: { select: { name: true } },
    },
  });

  return NextResponse.json({ projects, total: projects.length });
}
