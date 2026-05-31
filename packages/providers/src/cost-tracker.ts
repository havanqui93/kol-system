import { prisma } from "@kol/database";

export type CostCategory = "llm" | "tts" | "video" | "subtitle" | "storage";

export interface CostIncrement {
  category: CostCategory;
  amountUsd: number;
}

/**
 * Atomically increments cost tracking for a project.
 * Creates the CostTracking record if it doesn't exist yet.
 */
export async function incrementProjectCost(
  projectId: string,
  userId: string,
  increments: CostIncrement[]
): Promise<void> {
  const totalIncrement = increments.reduce((sum, i) => sum + i.amountUsd, 0);

  const llm = sum(increments, "llm");
  const tts = sum(increments, "tts");
  const video = sum(increments, "video");
  const subtitle = sum(increments, "subtitle");
  const storage = sum(increments, "storage");

  await prisma.$executeRaw`
    INSERT INTO cost_tracking (id, user_id, project_id, llm_cost_usd, tts_cost_usd, video_cost_usd, subtitle_cost_usd, storage_cost_usd, total_cost_usd, updated_at)
    VALUES (gen_random_uuid()::text, ${userId}, ${projectId}, ${llm}, ${tts}, ${video}, ${subtitle}, ${storage}, ${totalIncrement}, NOW())
    ON CONFLICT (project_id) DO UPDATE SET
      llm_cost_usd      = cost_tracking.llm_cost_usd      + EXCLUDED.llm_cost_usd,
      tts_cost_usd      = cost_tracking.tts_cost_usd      + EXCLUDED.tts_cost_usd,
      video_cost_usd    = cost_tracking.video_cost_usd    + EXCLUDED.video_cost_usd,
      subtitle_cost_usd = cost_tracking.subtitle_cost_usd + EXCLUDED.subtitle_cost_usd,
      storage_cost_usd  = cost_tracking.storage_cost_usd  + EXCLUDED.storage_cost_usd,
      total_cost_usd    = cost_tracking.total_cost_usd    + EXCLUDED.total_cost_usd,
      updated_at        = NOW()
  `;
}

function sum(increments: CostIncrement[], category: CostCategory): number {
  return increments.filter((i) => i.category === category).reduce((s, i) => s + i.amountUsd, 0);
}
