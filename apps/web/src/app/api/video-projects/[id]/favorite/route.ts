import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { handleApiError } from "@/lib/api-error";
import { cacheDel, CacheKeys } from "@/lib/cache";

// Toggle favorite using notes field metadata — stored as JSON prefix until schema migration
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";
    const project = await prisma.videoProject.findFirst({
      where: { id: params.id, userId },
      select: { id: true, notes: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Store favorite flag in a simple way via metadata comment in notes
    // (production: add isFavorite column to schema)
    const isFav = (project.notes ?? "").startsWith("[★]");
    const newNotes = isFav
      ? (project.notes ?? "").replace(/^\[★\]\s*/, "")
      : `[★] ${project.notes ?? ""}`.trim();

    await prisma.videoProject.update({
      where: { id: params.id },
      data: { notes: newNotes },
    });

    await cacheDel(CacheKeys.projectStats(userId));

    return NextResponse.json({ favorited: !isFav });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";
    const project = await prisma.videoProject.findFirst({
      where: { id: params.id, userId },
      select: { notes: true },
    });

    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ favorited: (project.notes ?? "").startsWith("[★]") });
  } catch (err) {
    return handleApiError(err);
  }
}
