import { prisma } from "@kol/database";

export function getRequestUserId(request: Request) {
  return request.headers.get("x-user-id") ?? "demo-user";
}

export async function ensureUser(userId: string) {
  return prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: `${userId}@local.test`,
      name: userId === "demo-user" ? "Demo User" : undefined,
    },
  });
}
