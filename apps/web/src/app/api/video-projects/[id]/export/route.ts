import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// GET /api/video-projects/:id/export — download project as JSON
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const project = await prisma.videoProject.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      kolProfile: { select: { id: true, name: true, voiceGender: true, voiceStyle: true, language: true } },
      scripts: { orderBy: { version: "desc" } },
      scenes: { orderBy: { sceneIndex: "asc" } },
      assets: { orderBy: { createdAt: "asc" } },
      costTracking: true,
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    project,
  };

  const filename = `kol-project-${project.id.slice(-8)}-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
