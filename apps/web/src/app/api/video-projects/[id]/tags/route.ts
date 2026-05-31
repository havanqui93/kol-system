import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

function tagsKey(projectId: string) {
  return `project:tags:${projectId}`;
}

// GET /api/video-projects/:id/tags
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const tags = await redis.smembers(tagsKey(params.id));
  return NextResponse.json({ tags: tags.sort() });
}

// POST /api/video-projects/:id/tags — add a tag
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { tag } = await req.json();
  if (!tag || typeof tag !== "string") {
    return NextResponse.json({ error: "tag required" }, { status: 400 });
  }
  const normalized = tag.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 30);
  if (!normalized) return NextResponse.json({ error: "invalid tag" }, { status: 400 });

  const key = tagsKey(params.id);
  const size = await redis.scard(key);
  if (size >= 10) {
    return NextResponse.json({ error: "Max 10 tags per project" }, { status: 422 });
  }
  await redis.sadd(key, normalized);
  await redis.expire(key, 365 * 86400);

  const tags = await redis.smembers(key);
  return NextResponse.json({ tags: tags.sort() });
}

// DELETE /api/video-projects/:id/tags — remove a tag
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  if (!tag) return NextResponse.json({ error: "tag required" }, { status: 400 });

  await redis.srem(tagsKey(params.id), tag);
  const tags = await redis.smembers(tagsKey(params.id));
  return NextResponse.json({ tags: tags.sort() });
}
