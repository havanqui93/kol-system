import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { ensureUser, getRequestUserId } from "@/lib/user";

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
});

// POST /api/video-projects
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateProjectSchema.parse(body);

    // TODO: replace with real auth
    const userId = getRequestUserId(request);
    await ensureUser(userId);

    const project = await prisma.videoProject.create({
      data: { userId, ...validated },
    });

    // Initialize cost tracking
    await prisma.costTracking.create({
      data: { userId, projectId: project.id },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
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
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);

  const [projects, total] = await Promise.all([
    prisma.videoProject.findMany({
      where: { userId, ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { name: true, imageUrls: true } },
        kolProfile: { select: { name: true } },
      },
    }),
    prisma.videoProject.count({ where: { userId } }),
  ]);

  return NextResponse.json({ projects, total, page, limit });
}
