import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { getRequestUserId, ensureUser } from "@/lib/user";

// POST /api/video-projects/:id/duplicate
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  await ensureUser(userId);

  const original = await prisma.videoProject.findFirst({
    where: { id: params.id, userId },
  });
  if (!original) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const clone = await prisma.videoProject.create({
    data: {
      userId,
      kolProfileId:   original.kolProfileId,
      productId:      original.productId,
      title:          original.title ? `${original.title} (bản sao)` : undefined,
      videoType:      original.videoType,
      platform:       original.platform,
      language:       original.language,
      durationSeconds: original.durationSeconds,
      qualityPreset:  original.qualityPreset,
      brandTone:      original.brandTone,
      status:         "draft",
    },
  });

  await prisma.costTracking.create({
    data: { userId, projectId: clone.id },
  });

  return NextResponse.json(clone, { status: 201 });
}
