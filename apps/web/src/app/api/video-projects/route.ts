import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { ensureUser, getRequestUserId } from "@/lib/user";
import { zodErrorResponse } from "@/lib/zod-error";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

const VIDEO_TYPE_LABELS: Record<string, string> = {
  product_review: "Review",
  affiliate: "Affiliate",
  used_car: "Xe cũ",
  virtual_kol: "KOL ảo",
  b_roll: "B-roll",
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube_shorts: "YT Shorts",
};

function buildAutoTitle(productName: string, videoType: string, platform: string): string {
  const typeLabel = VIDEO_TYPE_LABELS[videoType] ?? videoType;
  const platformLabel = PLATFORM_LABELS[platform] ?? platform;
  return `${typeLabel} - ${productName} (${platformLabel})`;
}

// Platform-specific max duration limits (seconds)
const PLATFORM_MAX_DURATION: Record<string, number> = {
  tiktok: 60,
  facebook: 60,
  instagram: 60,
  youtube_shorts: 60,
};

const CreateProjectSchema = z.object({
  title: z.string().optional(),
  videoType: z.enum(["product_review", "affiliate", "used_car", "virtual_kol", "b_roll"]).default("product_review"),
  platform: z.enum(["tiktok", "facebook", "instagram", "youtube_shorts"]).default("tiktok"),
  language: z.string().default("vi"),
  durationSeconds: z.number().int().min(15).max(60).default(30),
  qualityPreset: z.enum(["cheap", "balanced", "premium"]).default("balanced"),
  brandTone: z.string().optional(),
  kolProfileId: z.string().optional(),
  productId: z.string().optional(),
  budgetLimitUsd: z.number().positive().optional(),
}).refine(
  (data) => {
    const maxDur = PLATFORM_MAX_DURATION[data.platform] ?? 60;
    return data.durationSeconds <= maxDur;
  },
  (data) => ({
    message: `Nền tảng ${data.platform} chỉ hỗ trợ tối đa ${PLATFORM_MAX_DURATION[data.platform] ?? 60}s`,
    path: ["durationSeconds"],
  })
);

// POST /api/video-projects
export async function POST(request: Request) {
  const rateLimitResponse = await checkRateLimit(request, RATE_LIMITS.createProject);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const validated = CreateProjectSchema.parse(body);

    const userId = getRequestUserId(request);
    await ensureUser(userId);

    // Auto-generate title from product name if not provided
    let title = validated.title;
    if (!title && validated.productId) {
      const product = await prisma.product.findUnique({
        where: { id: validated.productId },
        select: { name: true },
      });
      if (product) {
        title = buildAutoTitle(product.name, validated.videoType, validated.platform);
      }
    }

    const { budgetLimitUsd, ...projectData } = validated;
    const project = await prisma.videoProject.create({
      data: { userId, ...projectData, title },
    });

    await prisma.costTracking.create({
      data: {
        userId,
        projectId: project.id,
        ...(budgetLimitUsd ? { budgetLimitUsd } : {}),
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return zodErrorResponse(error);
    }
    console.error("POST /api/video-projects", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/video-projects
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const platform = url.searchParams.get("platform");
  const q = url.searchParams.get("q");
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);

  const where = {
    userId,
    ...(status ? { status: status as any } : {}),
    ...(platform ? { platform: platform as any } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.videoProject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { name: true } },
        kolProfile: { select: { name: true } },
        costTracking: { select: { totalCostUsd: true } },
      },
    }),
    prisma.videoProject.count({ where }),
  ]);

  return NextResponse.json(
    { projects, total, page, limit },
    {
      headers: {
        "Cache-Control": "private, no-cache, must-revalidate",
      },
    }
  );
}
