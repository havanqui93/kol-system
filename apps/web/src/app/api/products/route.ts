import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { ensureUser, getRequestUserId } from "@/lib/user";

const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.string().optional(),
  promotion: z.string().optional(),
  targetCustomer: z.string().optional(),
  category: z.string().optional(),
  imageUrls: z.array(z.string().url()).default([]),
});

export async function POST(request: Request) {
  const userId = getRequestUserId(request);
  await ensureUser(userId);

  const body = await request.json();
  const validated = CreateProductSchema.parse(body);
  const normalizedPrice = validated.price?.replace(/[^\d]/g, "") || undefined;

  const product = await prisma.product.create({
    data: {
      userId,
      name: validated.name,
      description: validated.description,
      price: normalizedPrice,
      promotion: validated.promotion,
      targetCustomer: validated.targetCustomer,
      category: validated.category,
      imageUrls: validated.imageUrls,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

export async function GET(request: Request) {
  const userId = getRequestUserId(request);
  const products = await prisma.product.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { videoProjects: true } } },
  });

  return NextResponse.json({ products });
}
