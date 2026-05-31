import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// POST /api/video-projects/:id/archive — soft-archive (set archivedAt)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const project = await prisma.videoProject.findFirst({ where: { id: params.id, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.videoProject.update({
    where: { id: params.id },
    data: { archivedAt: new Date() },
  });
  return NextResponse.json({ id: updated.id, archivedAt: updated.archivedAt });
}

// DELETE /api/video-projects/:id/archive — unarchive
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const project = await prisma.videoProject.findFirst({ where: { id: params.id, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.videoProject.update({
    where: { id: params.id },
    data: { archivedAt: null },
  });
  return NextResponse.json({ id: updated.id, archivedAt: updated.archivedAt });
}
