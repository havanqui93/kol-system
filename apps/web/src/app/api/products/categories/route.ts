import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// GET /api/products/categories — list all distinct categories with count
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";

  const products = await prisma.product.findMany({
    where: { userId },
    select: { category: true },
  });

  const counts: Record<string, number> = {};
  for (const p of products) {
    const cat = p.category ?? "Khác";
    counts[cat] = (counts[cat] ?? 0) + 1;
  }

  const categories = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ categories });
}
