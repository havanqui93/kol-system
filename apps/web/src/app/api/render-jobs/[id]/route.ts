import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// GET /api/render-jobs/:id
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const renderJob = await prisma.renderJob.findUnique({
    where: { id: params.id },
    include: { project: { select: { userId: true, finalVideoUrl: true, status: true } } },
  });

  if (!renderJob) return NextResponse.json({ error: "Render job not found" }, { status: 404 });

  return NextResponse.json(renderJob);
}
