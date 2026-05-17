import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// GET /api/social/accounts — list all connected accounts for this user
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";

  const accounts = await prisma.socialAccount.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      platform: true,
      accountName: true,
      accountId: true,
      pageId: true,
      pageName: true,
      tokenExpiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ accounts });
}
