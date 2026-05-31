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
  const pct = limit > 0 ? (spent / limit) * 100 : 0;

  if (pct >= 80 && pct < 100) {
    // Structured warning log — can be picked up by log aggregator / alerting
    console.warn(
      JSON.stringify({
        level: "warn",
        event: "budget_alert",
        projectId,
        spentUsd: spent,
        limitUsd: limit,
        percentUsed: Math.round(pct),
        ts: new Date().toISOString(),
      })
    );
  }

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
