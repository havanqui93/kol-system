import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { getRequestUserId } from "@/lib/user";

// GET /api/video-projects/:id/export — full project JSON download
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);

  const project = await prisma.videoProject.findFirst({
    where: { id: params.id, userId },
    include: {
      product: true,
      kolProfile: true,
      scripts: { orderBy: { version: "asc" } },
      scenes: { orderBy: { sceneIndex: "asc" } },
      assets: { orderBy: { createdAt: "asc" } },
      costTracking: true,
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filename = `kol-project-${project.id.slice(-8)}.json`;
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), project }, null, 2);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
