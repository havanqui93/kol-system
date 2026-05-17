import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { queues } from "@/lib/queues";

const PublishSchema = z.object({
  platform: z.enum(["tiktok", "facebook", "youtube_shorts"]),
  socialAccountId: z.string(),            // which connected account to post from
  title: z.string().optional(),
  description: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
});

// POST /api/video-projects/:id/publish
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const { id: projectId } = params;

  const body = await request.json();
  const { platform, socialAccountId, title, description, hashtags, scheduledAt } =
    PublishSchema.parse(body);

  const [project, socialAccount] = await Promise.all([
    prisma.videoProject.findFirst({ where: { id: projectId, userId } }),
    prisma.socialAccount.findFirst({ where: { id: socialAccountId, userId, isActive: true } }),
  ]);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!project.finalVideoUrl) return NextResponse.json({ error: "No final video. Render first." }, { status: 400 });
  if (!socialAccount) return NextResponse.json({ error: "Social account not found or disconnected." }, { status: 404 });
  if (socialAccount.platform !== platform) {
    return NextResponse.json({ error: "Account platform does not match requested platform." }, { status: 400 });
  }

  const publishJob = await prisma.publishJob.create({
    data: {
      projectId,
      platform,
      status: "scheduled",
      title: title ?? project.title ?? "KOL Video",
      description: description ?? "",
      hashtags: hashtags ?? [],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  const delayMs = scheduledAt
    ? Math.max(0, new Date(scheduledAt).getTime() - Date.now())
    : 0;

  const job = await queues.publishVideo.add(
    "publish-video",
    {
      projectId,
      userId,
      publishJobId: publishJob.id,
      platform,
      socialAccountId,
      finalVideoUrl: project.finalVideoUrl,
      title: publishJob.title ?? "",
      description: publishJob.description ?? "",
      hashtags: publishJob.hashtags,
      scheduledAt,
    },
    delayMs > 0 ? { delay: delayMs } : undefined
  );

  return NextResponse.json({ jobId: job.id, publishJobId: publishJob.id, status: "queued" }, { status: 202 });
}

// GET /api/video-projects/:id/publish — list publish jobs for this project
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const jobs = await prisma.publishJob.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ jobs });
}
