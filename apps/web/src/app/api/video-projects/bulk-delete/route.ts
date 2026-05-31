import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";

const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
});

// POST /api/video-projects/bulk-delete
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";

  const body = await request.json();
  const { ids } = BulkDeleteSchema.parse(body);

  // Only delete projects belonging to the user
  const { count } = await prisma.videoProject.deleteMany({
    where: {
      id: { in: ids },
      userId,
    },
  });

  return NextResponse.json({ deleted: count });
}
