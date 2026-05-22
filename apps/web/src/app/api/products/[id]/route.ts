import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { getRequestUserId } from "@/lib/user";

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
