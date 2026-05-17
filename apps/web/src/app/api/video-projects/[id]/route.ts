import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";

// GET /api/video-projects/:id
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const project = await prisma.videoProject.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      kolProfile: true,
      scripts: { orderBy: { version: "desc" } },
      assets: { orderBy: { createdAt: "desc" } },
      costTracking: true,
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

const PatchSchema = z.object({
  title: z.string().optional(),
  brandTone: z.string().optional(),
  platform: z.enum(["tiktok", "facebook", "instagram", "youtube_shorts"]).optional(),
  durationSeconds: z.number().int().min(15).max(60).optional(),
});

// PATCH /api/video-projects/:id
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const body = await request.json();
  const data = PatchSchema.parse(body);

  const project = await prisma.videoProject.findFirst({ where: { id: params.id, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.videoProject.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

// DELETE /api/video-projects/:id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const project = await prisma.videoProject.findFirst({ where: { id: params.id, userId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.videoProject.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
