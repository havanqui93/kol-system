import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const MAX_EVENTS = 100;

export interface ActivityEvent {
  at: string;
  event: string;
  detail?: string;
}

function activityKey(projectId: string) {
  return `project:activity:${projectId}`;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const raw = await redis.lrange(activityKey(params.id), 0, MAX_EVENTS - 1);
  const events: ActivityEvent[] = raw.map((r) => JSON.parse(r));
  return NextResponse.json({ events });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { event, detail } = await req.json();
  if (!event || typeof event !== "string") {
    return NextResponse.json({ error: "event required" }, { status: 400 });
  }

  const entry: ActivityEvent = { at: new Date().toISOString(), event, detail };
  const key = activityKey(params.id);
  await redis.lpush(key, JSON.stringify(entry));
  await redis.ltrim(key, 0, MAX_EVENTS - 1);
  await redis.expire(key, 90 * 86400); // 90 days TTL

  return NextResponse.json({ ok: true });
}
