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
        select: { hook: true, scenes: { select: { order: true, voiceText: true, visualPrompt: true } } },
        take: 1,
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}
