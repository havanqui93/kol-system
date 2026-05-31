import { prisma } from "@kol/database";

export class BudgetExceededError extends Error {
  constructor(
    public readonly spentUsd: number,
    public readonly limitUsd: number
  ) {
    super(`Budget exceeded: spent $${spentUsd.toFixed(4)} of $${limitUsd.toFixed(4)} limit`);
    this.name = "BudgetExceededError";
  }
}

export async function assertBudget(projectId: string): Promise<void> {
  const tracking = await prisma.costTracking.findUnique({ where: { projectId } });
  if (!tracking || tracking.budgetLimitUsd === null) return;

  const spent = Number(tracking.totalCostUsd);
  const limit = Number(tracking.budgetLimitUsd);

  if (spent >= limit) {
    throw new BudgetExceededError(spent, limit);
  }
}

export async function getBudgetStatus(projectId: string) {
  const tracking = await prisma.costTracking.findUnique({ where: { projectId } });
  if (!tracking) return null;

  const spent = Number(tracking.totalCostUsd);
  const limit = tracking.budgetLimitUsd ? Number(tracking.budgetLimitUsd) : null;

  return {
    spentUsd: spent,
    limitUsd: limit,
    remainingUsd: limit !== null ? Math.max(0, limit - spent) : null,
    percentUsed: limit !== null && limit > 0 ? Math.min(100, (spent / limit) * 100) : null,
    exceeded: limit !== null ? spent >= limit : false,
  };
}
