import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { getRequestUserId } from "@/lib/user";

const PatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().optional(),
  voiceGender: z.enum(["male", "female"]).optional(),
  voiceStyle: z.enum(["energetic", "professional", "funny", "calm", "authoritative"]).optional(),
  language: z.string().optional(),
  stylePrompt: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  const profile = await prisma.kolProfile.findFirst({ where: { id: params.id, userId } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json();
  const data = PatchSchema.parse(body);
  const updated = await prisma.kolProfile.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  const profile = await prisma.kolProfile.findFirst({ where: { id: params.id, userId } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.kolProfile.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  const profile = await prisma.kolProfile.findFirst({ where: { id: params.id, userId } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(profile);
}
