import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { handleApiError } from "@/lib/api-error";
import { cacheDel, CacheKeys } from "@/lib/cache";

// Restore a failed project back to draft so it can be regenerated
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";

    const project = await prisma.videoProject.findFirst({
      where: { id: params.id, userId },
      select: { id: true, status: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed projects can be restored", code: "INVALID_STATUS" },
        { status: 409 }
      );
    }

    await prisma.videoProject.update({
      where: { id: params.id },
      data: { status: "draft", errorMessage: null },
    });

    await cacheDel(CacheKeys.projectStats(userId));

    return NextResponse.json({ restored: true, status: "draft" });
  } catch (err) {
    return handleApiError(err);
  }
}
