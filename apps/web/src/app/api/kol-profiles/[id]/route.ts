import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";

// GET /api/kol-profiles/:id
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const profile = await prisma.kolProfile.findFirst({ where: { id: params.id, userId } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}

const PatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  voiceStyle: z.enum(["energetic", "professional", "funny", "calm", "authoritative"]).optional(),
  voiceId: z.string().optional(),
  stylePrompt: z.string().max(1000).optional(),
});

// PATCH /api/kol-profiles/:id
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const body = await request.json();
  const data = PatchSchema.parse(body);

  const profile = await prisma.kolProfile.findFirst({ where: { id: params.id, userId } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.kolProfile.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

// DELETE /api/kol-profiles/:id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const profile = await prisma.kolProfile.findFirst({ where: { id: params.id, userId } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.kolProfile.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
