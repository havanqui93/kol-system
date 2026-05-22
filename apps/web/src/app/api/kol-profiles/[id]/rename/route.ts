import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { getRequestUserId } from "@/lib/user";

const Schema = z.object({ name: z.string().min(1).max(80) });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  const profile = await prisma.kolProfile.findFirst({ where: { id: params.id, userId } });
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name } = Schema.parse(await request.json());
  const updated = await prisma.kolProfile.update({ where: { id: params.id }, data: { name } });
  return NextResponse.json(updated);
}
