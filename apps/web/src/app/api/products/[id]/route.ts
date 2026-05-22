import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { getRequestUserId } from "@/lib/user";

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  promotion: z.string().optional(),
  category: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  const product = await prisma.product.findFirst({ where: { id: params.id, userId } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json();
  const data = PatchSchema.parse(body);
  const updated = await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  const product = await prisma.product.findFirst({ where: { id: params.id, userId } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.product.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  const product = await prisma.product.findFirst({ where: { id: params.id, userId } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}
