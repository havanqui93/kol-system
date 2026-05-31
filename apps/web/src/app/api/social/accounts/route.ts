import { NextResponse } from "next/server";
import { z } from "zod";
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

const DisconnectSchema = z.object({ accountId: z.string() });

// DELETE /api/social/accounts — disconnect (soft-delete) a social account
export async function DELETE(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";

  const body = await request.json();
  const { accountId } = DisconnectSchema.parse(body);

  const account = await prisma.socialAccount.findFirst({
    where: { id: accountId, userId },
  });

  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  await prisma.socialAccount.update({
    where: { id: accountId },
    data: { isActive: false },
  });

  return NextResponse.json({ disconnected: true });
}
