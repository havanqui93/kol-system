import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { getRequestUserId } from "@/lib/user";

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
