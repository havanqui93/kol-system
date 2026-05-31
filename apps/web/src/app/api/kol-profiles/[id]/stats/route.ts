import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { handleApiError } from "@/lib/api-error";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";

    const profile = await prisma.kolProfile.findFirst({
      where: { id: params.id, userId },
      select: { id: true, name: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "KOL profile not found" }, { status: 404 });
    }

    const [totalProjects, statusGroups, recentProjects] = await Promise.all([
      prisma.videoProject.count({ where: { kolProfileId: params.id, archivedAt: null } }),
      prisma.videoProject.groupBy({
        by: ["status"],
        where: { kolProfileId: params.id, archivedAt: null },
        _count: { id: true },
      }),
      prisma.videoProject.findMany({
        where: { kolProfileId: params.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, status: true, createdAt: true, finalVideoUrl: true },
      }),
    ]);

    const byStatus = Object.fromEntries(statusGroups.map((s) => [s.status, s._count.id]));

    return NextResponse.json({
      profileId: params.id,
      profileName: profile.name,
      totalProjects,
      published: byStatus["published"] ?? 0,
      failed: byStatus["failed"] ?? 0,
      byStatus,
      recentProjects,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
