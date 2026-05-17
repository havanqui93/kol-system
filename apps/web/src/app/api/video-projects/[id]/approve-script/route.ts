import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@kol/database";

const ApproveSchema = z.object({ scriptId: z.string() });

// POST /api/video-projects/:id/approve-script
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const { id: projectId } = params;

  const body = await request.json();
  const { scriptId } = ApproveSchema.parse(body);

  const [project, script] = await Promise.all([
    prisma.videoProject.findFirst({ where: { id: projectId, userId } }),
    prisma.videoScript.findFirst({ where: { id: scriptId, projectId } }),
  ]);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!script) return NextResponse.json({ error: "Script not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.videoScript.updateMany({ where: { projectId }, data: { isApproved: false } }),
    prisma.videoScript.update({ where: { id: scriptId }, data: { isApproved: true } }),
    prisma.videoProject.update({ where: { id: projectId }, data: { status: "script_approved" } }),
  ]);

  return NextResponse.json({ success: true });
}
