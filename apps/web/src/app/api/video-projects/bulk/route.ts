import { NextResponse } from "next/server";
import { prisma, VideoProjectStatus } from "@kol/database";
import { getRequestUserId } from "@/lib/user";

const ALLOWED_STATUSES: VideoProjectStatus[] = [
  VideoProjectStatus.draft,
  VideoProjectStatus.failed,
  VideoProjectStatus.published,
];

// PATCH /api/video-projects/bulk?status=failed — reset failed projects to draft
export async function PATCH(request: Request) {
  const userId = getRequestUserId(request);
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") as VideoProjectStatus | null;

  if (statusParam !== VideoProjectStatus.failed) {
    return NextResponse.json({ error: "Only 'failed' status supported for reset" }, { status: 400 });
  }

  const { count } = await prisma.videoProject.updateMany({
    where: { userId, status: statusParam },
    data: { status: VideoProjectStatus.draft, errorMessage: null },
  });

  return NextResponse.json({ reset: count });
}

// DELETE /api/video-projects/bulk?status=failed — bulk delete by status
export async function DELETE(request: Request) {
  const userId = getRequestUserId(request);
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status") as VideoProjectStatus | null;

  if (!statusParam || !ALLOWED_STATUSES.includes(statusParam)) {
    return NextResponse.json({ error: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` }, { status: 400 });
  }

  const { count } = await prisma.videoProject.deleteMany({ where: { userId, status: statusParam } });

  return NextResponse.json({ deleted: count });
}
