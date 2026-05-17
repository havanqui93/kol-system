import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";
import { queues } from "@/lib/queues";

const AudioSchema = z.object({
  voiceId: z.string().optional(),
  voiceGender: z.enum(["male", "female"]).optional(),
  voiceStyle: z.enum(["energetic", "professional", "funny", "calm", "authoritative"]).optional(),
});

// POST /api/video-projects/:id/generate-audio
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const { id: projectId } = params;

  const body = await request.json();
  const options = AudioSchema.parse(body);

  const [project, approvedScript] = await Promise.all([
    prisma.videoProject.findFirst({ where: { id: projectId, userId } }),
    prisma.videoScript.findFirst({ where: { projectId, isApproved: true } }),
  ]);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!approvedScript) return NextResponse.json({ error: "No approved script found. Approve a script first." }, { status: 400 });

  await prisma.videoProject.update({
    where: { id: projectId },
    data: { status: "audio_generating" },
  });

  const job = await queues.generateAudio.add("generate-audio", {
    projectId,
    userId,
    scriptId: approvedScript.id,
    ...options,
    language: project.language,
  });

  return NextResponse.json({ jobId: job.id, status: "queued" }, { status: 202 });
}
