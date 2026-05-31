import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { handleApiError } from "@/lib/api-error";

// Return the 10 most recently updated projects for quick access
export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";

    const projects = await prisma.videoProject.findMany({
      where: { userId, archivedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        platform: true,
        thumbnailUrl: true,
        finalVideoUrl: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ projects });
  } catch (err) {
    return handleApiError(err);
  }
}
