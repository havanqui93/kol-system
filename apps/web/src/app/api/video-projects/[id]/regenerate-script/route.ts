import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { queues } from "@/lib/queues";
import { assertBudget, BudgetExceededError } from "@/lib/budget-guard";

const RegenerateSchema = z.object({
  feedback: z.string().max(500).optional(),
});

// POST /api/video-projects/:id/regenerate-script
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const { id: projectId } = params;

  const project = await prisma.videoProject.findFirst({ where: { id: projectId, userId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (!["script_ready", "script_approved", "draft"].includes(project.status)) {
    return NextResponse.json(
      { error: "Can only regenerate script when in draft, script_ready or script_approved status" },
      { status: 409 }
    );
  }

  try {
    await assertBudget(projectId);
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      return NextResponse.json({ error: "Budget exceeded", detail: err.message }, { status: 402 });
    }
    throw err;
  }

  const body = await request.json().catch(() => ({}));
  const { feedback } = RegenerateSchema.parse(body);

  const costTracking = await prisma.costTracking.findUnique({ where: { projectId } });

  await prisma.videoProject.update({
    where: { id: projectId },
    data: { status: "script_generating", errorMessage: null },
  });

  const job = await queues.generateScript.add("generate-script", {
    projectId,
    userId,
    feedback,
    budgetLimitUsd: costTracking?.budgetLimitUsd ? Number(costTracking.budgetLimitUsd) : undefined,
  });

  return NextResponse.json({ jobId: job.id, status: "queued" }, { status: 202 });
}
