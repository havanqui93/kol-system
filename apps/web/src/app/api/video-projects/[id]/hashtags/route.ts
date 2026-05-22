import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { AnthropicLLMProvider } from "@kol/providers";
import { getRequestUserId } from "@/lib/user";

// POST /api/video-projects/:id/hashtags
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = getRequestUserId(request);
  const { id: projectId } = params;

  const [project, script] = await Promise.all([
    prisma.videoProject.findFirst({ where: { id: projectId, userId }, include: { product: true } }),
    prisma.videoScript.findFirst({ where: { projectId, isApproved: true } }),
  ]);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!script)  return NextResponse.json({ error: "No approved script" }, { status: 400 });

  const llm = new AnthropicLLMProvider();
  const platform = project.platform;
  const platformName = { tiktok: "TikTok", facebook: "Facebook Reels", instagram: "Instagram", youtube_shorts: "YouTube Shorts" }[platform] ?? platform;

  const { data, cost } = await llm.generateJSON<{ hashtags: string[]; caption: string }>(
    [
      {
        role: "system",
        content: `You are a Vietnamese social media expert specializing in ${platformName} content.`,
      },
      {
        role: "user",
        content: `Generate hashtags and a short caption for this ${platformName} video script:

Script: ${script.fullScript}
Product: ${project.product?.name ?? "product"}
Platform: ${platformName}

Return JSON: { "hashtags": ["#tag1", "#tag2", ...15 tags max], "caption": "short Vietnamese caption under 150 chars" }`,
      },
    ],
    { model: "claude-haiku-4-5-20251001", maxTokens: 512 }
  );

  // Track cost
  await prisma.costTracking.upsert({
    where: { projectId },
    create: { userId, projectId, llmCostUsd: cost.costUsd, totalCostUsd: cost.costUsd },
    update: { llmCostUsd: { increment: cost.costUsd }, totalCostUsd: { increment: cost.costUsd } },
  });

  return NextResponse.json(data);
}
