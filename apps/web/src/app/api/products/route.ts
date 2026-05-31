import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { ensureUser, getRequestUserId } from "@/lib/user";
import { sanitizeText } from "@/lib/sanitize";
import { zodErrorResponse } from "@/lib/zod-error";

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
  let validated;
  try {
    validated = CreateProductSchema.parse(body);
  } catch (err: any) {
    return zodErrorResponse(err);
  }
  const normalizedPrice = validated.price?.replace(/[^\d]/g, "") || undefined;

  const product = await prisma.product.create({
    data: {
      userId,
      name: sanitizeText(validated.name, 200),
      description: validated.description ? sanitizeText(validated.description, 1000) : undefined,
      price: normalizedPrice,
      promotion: validated.promotion ? sanitizeText(validated.promotion, 200) : undefined,
      targetCustomer: validated.targetCustomer ? sanitizeText(validated.targetCustomer, 500) : undefined,
      category: validated.category ? sanitizeText(validated.category, 100) : undefined,
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
  });

  return NextResponse.json({ products });
}
