import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const TEMPLATE_KEY_PREFIX = "project:template:";

// DELETE /api/video-projects/templates/:id
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const key = `${TEMPLATE_KEY_PREFIX}${userId}:${params.id}`;
  const deleted = await redis.del(key);
  if (!deleted) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
