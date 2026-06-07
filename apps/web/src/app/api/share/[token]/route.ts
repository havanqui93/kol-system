import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { redis } from "@/lib/redis";

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const projectId = await redis.get(`share:token:${params.token}`);
  if (!projectId) {
    return NextResponse.json({ error: "Link đã hết hạn hoặc không hợp lệ" }, { status: 404 });
  }

  const project = await prisma.videoProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      platform: true,
      videoType: true,
      durationSeconds: true,
      status: true,
      finalVideoUrl: true,
      createdAt: true,
      scripts: {
        where: { isApproved: true },
        select: { hook: true },
        take: 1,
      },
      scenes: {
        select: { sceneIndex: true, audioSegment: true, klingPrompt: true },
        orderBy: { sceneIndex: "asc" },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}
