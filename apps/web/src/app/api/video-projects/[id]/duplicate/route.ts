import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { apiError } from "@/lib/api-error";

// POST /api/video-projects/:id/duplicate — clone project settings
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const { id: sourceId } = params;

  const source = await prisma.videoProject.findFirst({
    where: { id: sourceId, userId },
    include: { costTracking: { select: { budgetLimitUsd: true } } },
  });

  if (!source) return apiError("Project not found", 404, { code: "NOT_FOUND" });

  const duplicate = await prisma.videoProject.create({
    data: {
      userId,
      kolProfileId: source.kolProfileId,
      productId: source.productId,
      title: source.title ? `${source.title} (bản sao)` : null,
      videoType: source.videoType,
      platform: source.platform,
      language: source.language,
      durationSeconds: source.durationSeconds,
      qualityPreset: source.qualityPreset,
      brandTone: source.brandTone,
      status: "draft",
    },
  });

  const budgetLimit = source.costTracking[0]?.budgetLimitUsd;
  await prisma.costTracking.create({
    data: {
      userId,
      projectId: duplicate.id,
      ...(budgetLimit ? { budgetLimitUsd: budgetLimit } : {}),
    },
  });

  return NextResponse.json(duplicate, { status: 201 });
}
