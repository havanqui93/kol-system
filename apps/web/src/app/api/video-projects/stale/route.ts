import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

const STALE_DAYS = 14; // drafts older than this are considered stale

// GET /api/video-projects/stale — list draft projects not updated in > STALE_DAYS days
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const staleCutoff = new Date(Date.now() - STALE_DAYS * 86_400_000);

  const stale = await prisma.videoProject.findMany({
    where: {
      userId,
      archivedAt: null,
      status: { in: ["draft", "script_ready", "script_generating"] },
      updatedAt: { lt: staleCutoff },
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "asc" },
    take: 20,
  });

  return NextResponse.json({
    staleProjects: stale,
    staleCount: stale.length,
    staleDays: STALE_DAYS,
  });
}
