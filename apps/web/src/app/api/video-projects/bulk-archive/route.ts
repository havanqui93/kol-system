import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";

const BulkArchiveSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(50),
  archive: z.boolean().default(true), // true = archive, false = unarchive
});

// POST /api/video-projects/bulk-archive
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const body = await request.json();
  const { ids, archive } = BulkArchiveSchema.parse(body);

  const result = await prisma.videoProject.updateMany({
    where: { id: { in: ids }, userId },
    data: { archivedAt: archive ? new Date() : null },
  });

  return NextResponse.json({ updated: result.count });
}
