import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { sanitizeText } from "@/lib/sanitize";

// GET /api/products/:id
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const product = await prisma.product.findFirst({ where: { id: params.id, userId } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

const PatchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  price: z.string().max(50).optional(),
  promotion: z.string().max(200).optional(),
  targetCustomer: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
});

// PATCH /api/products/:id
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const body = await request.json();
  const data = PatchSchema.parse(body);

  const product = await prisma.product.findFirst({ where: { id: params.id, userId } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const normalizedPrice = data.price?.replace(/[^\d]/g, "") || undefined;

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...(data.name ? { name: sanitizeText(data.name, 200) } : {}),
      ...(data.description !== undefined ? { description: data.description ? sanitizeText(data.description, 1000) : null } : {}),
      ...(data.price !== undefined ? { price: normalizedPrice } : {}),
      ...(data.promotion !== undefined ? { promotion: data.promotion ? sanitizeText(data.promotion, 200) : null } : {}),
      ...(data.targetCustomer !== undefined ? { targetCustomer: data.targetCustomer ? sanitizeText(data.targetCustomer, 500) : null } : {}),
      ...(data.category !== undefined ? { category: data.category ? sanitizeText(data.category, 100) : null } : {}),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/products/:id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const product = await prisma.product.findFirst({ where: { id: params.id, userId } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.product.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
