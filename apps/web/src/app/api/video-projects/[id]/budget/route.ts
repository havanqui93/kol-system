import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { handleApiError } from "@/lib/api-error";
import { budgetUpdateSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";
    const body = await request.json();
    const { budgetLimitUsd } = budgetUpdateSchema.parse(body);

    const project = await prisma.videoProject.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Upsert cost tracking record with new budget
    const tracking = await prisma.costTracking.upsert({
      where: { projectId: params.id },
      create: {
        userId,
        projectId: params.id,
        budgetLimitUsd: budgetLimitUsd !== null ? budgetLimitUsd.toString() : null,
      },
      update: {
        budgetLimitUsd: budgetLimitUsd !== null ? budgetLimitUsd.toString() : null,
      },
    });

    return NextResponse.json({
      budgetLimitUsd: tracking.budgetLimitUsd,
      totalCostUsd: tracking.totalCostUsd,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";

    const project = await prisma.videoProject.findFirst({
      where: { id: params.id, userId },
      include: {
        costTracking: {
          select: {
            totalCostUsd: true,
            budgetLimitUsd: true,
            llmCostUsd: true,
            ttsCostUsd: true,
            videoCostUsd: true,
            subtitleCostUsd: true,
            storageCostUsd: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // costTracking is a one-to-one relation but typed as array — take first element
    const tracking = Array.isArray(project.costTracking)
      ? project.costTracking[0]
      : project.costTracking;

    if (!tracking) {
      return NextResponse.json({
        budgetLimitUsd: null,
        totalCostUsd: "0",
        breakdown: null,
      });
    }

    const total = parseFloat(String(tracking.totalCostUsd));
    const limit = tracking.budgetLimitUsd ? parseFloat(String(tracking.budgetLimitUsd)) : null;

    return NextResponse.json({
      budgetLimitUsd: String(tracking.budgetLimitUsd ?? null),
      totalCostUsd: String(tracking.totalCostUsd),
      percentUsed: limit && limit > 0 ? Math.min(100, (total / limit) * 100) : null,
      remainingUsd: limit !== null ? Math.max(0, limit - total) : null,
      breakdown: {
        llm: String(tracking.llmCostUsd),
        tts: String(tracking.ttsCostUsd),
        video: String(tracking.videoCostUsd),
        subtitle: String(tracking.subtitleCostUsd),
        storage: String(tracking.storageCostUsd),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
