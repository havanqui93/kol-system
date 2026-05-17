import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// DELETE /api/social/accounts/:id — disconnect an account
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";

  const account = await prisma.socialAccount.findFirst({
    where: { id: params.id, userId },
  });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.socialAccount.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return new NextResponse(null, { status: 204 });
}
