import { Worker } from "bullmq";
import type { Redis } from "ioredis";
import { prisma } from "@kol/database";
import { AnthropicLLMProvider } from "@kol/providers";
import { IntakeAgent, ResearchAgent, ScriptAgent } from "@kol/agents";
import type { GenerateScriptJobPayload } from "@kol/queue";
import { QUEUE_NAMES } from "@kol/queue";

export function createGenerateScriptWorker(connection: Redis) {
  return new Worker<GenerateScriptJobPayload>(
    QUEUE_NAMES.GENERATE_SCRIPT,
    async (job) => {
      const { projectId, userId, budgetLimitUsd, feedback } = job.data;

      const project = await prisma.videoProject.findUnique({
        where: { id: projectId },
        include: { product: true, kolProfile: true },
      });

      if (!project) throw new Error(`Project ${projectId} not found`);

      const llm = new AnthropicLLMProvider();
      const intakeAgent = new IntakeAgent(llm);
      const researchAgent = new ResearchAgent(llm);
      const scriptAgent = new ScriptAgent(llm);

      let totalCost = 0;

      // 1. Intake
      await job.updateProgress(10);
      const { output: intakeOutput, costUsd: intakeCost } = await intakeAgent.run({
        productName: project.product?.name,
        productDescription: project.product?.description ?? undefined,
        price: project.product?.price?.toString() ?? undefined,
        promotion: project.product?.promotion ?? undefined,
        targetCustomer: project.product?.targetCustomer ?? undefined,
        imageUrls: project.product?.imageUrls ?? [],
        kolStyle: project.kolProfile?.stylePrompt ?? undefined,
        platform: project.platform,
        language: project.language,
        durationSeconds: project.durationSeconds,
      });
      totalCost += intakeCost;

      // Check budget at 90% threshold — fail fast before expensive stages
      if (budgetLimitUsd) {
        const tracking = await prisma.costTracking.findUnique({ where: { projectId }, select: { totalCostUsd: true } });
        const alreadySpent = Number(tracking?.totalCostUsd ?? 0);
        if (alreadySpent + totalCost >= budgetLimitUsd * 0.9) {
          throw new Error(`Budget alert: ${Math.round(((alreadySpent + totalCost) / budgetLimitUsd) * 100)}% of budget consumed`);
        }
      }

      // 2. Research
      await job.updateProgress(30);
      const { output: researchOutput, costUsd: researchCost } = await researchAgent.run(intakeOutput.normalizedContext);
      totalCost += researchCost;

      // 3. Script (or regenerate with feedback)
      await job.updateProgress(60);
      const duration = [15, 30, 45, 60].includes(project.durationSeconds)
        ? (project.durationSeconds as 15 | 30 | 45 | 60)
        : 30;

      const { output: scriptOutput, costUsd: scriptCost } = feedback
        ? await scriptAgent.regenerate(intakeOutput.normalizedContext, researchOutput, duration, feedback)
        : await scriptAgent.run(intakeOutput.normalizedContext, researchOutput, duration);
      totalCost += scriptCost;

      // 4. Persist to DB
      await job.updateProgress(90);

      const lastScript = await prisma.videoScript.findFirst({
        where: { projectId },
        orderBy: { version: "desc" },
        select: { version: true },
      });

      await prisma.$transaction([
        prisma.videoScript.create({
          data: {
            projectId,
            version: (lastScript?.version ?? 0) + 1,
            hook: scriptOutput.hook,
            problem: scriptOutput.problem ?? null,
            introduction: scriptOutput.introduction ?? null,
            benefits: scriptOutput.benefits ?? null,
            proof: scriptOutput.proof ?? null,
            offer: scriptOutput.offer ?? null,
            cta: scriptOutput.cta,
            fullScript: scriptOutput.fullScript,
            wordCount: scriptOutput.wordCount,
            estimatedDurationSeconds: scriptOutput.estimatedDurationSeconds,
          },
        }),
        prisma.videoProject.update({
          where: { id: projectId },
          data: { status: "script_ready" },
        }),
        prisma.costTracking.update({
          where: { projectId },
          data: {
            llmCostUsd: { increment: totalCost },
            totalCostUsd: { increment: totalCost },
          },
        }),
      ]);

      await prisma.providerUsage.create({
        data: {
          userId,
          projectId,
          provider: "anthropic",
          providerType: "llm",
          operation: "generate_script",
          costUsd: totalCost,
        },
      });

      await job.updateProgress(100);
      return { scriptGenerated: true, totalCostUsd: totalCost };
    },
    {
      connection,
      concurrency: Number(process.env.WORKER_CONCURRENCY_SCRIPT ?? "3"),
      limiter: { max: 10, duration: 60000 },
    }
  );
}
