import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { redis } from "@/lib/redis";

const SHARE_TTL = 7 * 86400; // 7 days

function shareKey(token: string) {
  return `share:token:${token}`;
}

// POST /api/video-projects/:id/share — create or refresh share link
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const project = await prisma.videoProject.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  await redis.setex(shareKey(token), SHARE_TTL, params.id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.json({ shareUrl: `${appUrl}/share/${token}`, expiresIn: "7 days" });
}

// GET /api/video-projects/:id/share — resolve project from token (for share page)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  // params.id is actually the token here when called from /api/share/:token
  const projectId = await redis.get(shareKey(params.id));
  if (!projectId) return NextResponse.json({ error: "Link expired or invalid" }, { status: 404 });
  return NextResponse.json({ projectId });
}
