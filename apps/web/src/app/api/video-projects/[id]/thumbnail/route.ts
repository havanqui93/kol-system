import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// POST /api/video-projects/:id/thumbnail
// Body: { thumbnailUrl: string } — client-supplied URL (e.g. from canvas capture or external source)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const { thumbnailUrl } = await request.json();

  if (!thumbnailUrl || typeof thumbnailUrl !== "string") {
    return NextResponse.json({ error: "thumbnailUrl required" }, { status: 400 });
  }

  const project = await prisma.videoProject.findFirst({ where: { id: params.id, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.videoProject.update({
    where: { id: params.id },
    data: { thumbnailUrl },
  });

  return NextResponse.json({ thumbnailUrl: updated.thumbnailUrl });
}
