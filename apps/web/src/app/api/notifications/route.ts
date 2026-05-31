import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const MAX_NOTIFICATIONS = 50;
const NOTIF_TTL = 30 * 86400; // 30 days

export interface Notification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  projectId?: string;
  readAt?: string | null;
  createdAt: string;
}

function notifKey(userId: string) {
  return `notifications:${userId}`;
}

// GET /api/notifications — list latest notifications
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const raw = await redis.lrange(notifKey(userId), 0, MAX_NOTIFICATIONS - 1);
  const notifications: Notification[] = raw.map((r) => JSON.parse(r));
  const unreadCount = notifications.filter((n) => !n.readAt).length;
  return NextResponse.json({ notifications, unreadCount });
}

// POST /api/notifications — create a notification
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const body = await request.json();
  const { type = "info", title, message, projectId } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const notif: Notification = {
    id: crypto.randomUUID(),
    type,
    title,
    message,
    projectId,
    readAt: null,
    createdAt: new Date().toISOString(),
  };

  const key = notifKey(userId);
  await redis.lpush(key, JSON.stringify(notif));
  await redis.ltrim(key, 0, MAX_NOTIFICATIONS - 1);
  await redis.expire(key, NOTIF_TTL);

  return NextResponse.json({ notification: notif });
}

// PATCH /api/notifications — mark all as read
export async function PATCH(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const key = notifKey(userId);
  const raw = await redis.lrange(key, 0, MAX_NOTIFICATIONS - 1);
  const now = new Date().toISOString();

  const updated = raw.map((r) => {
    const n: Notification = JSON.parse(r);
    return JSON.stringify({ ...n, readAt: n.readAt ?? now });
  });

  if (updated.length > 0) {
    const pipeline = redis.pipeline();
    pipeline.del(key);
    for (const item of updated) pipeline.rpush(key, item);
    pipeline.expire(key, NOTIF_TTL);
    await pipeline.exec();
  }

  return NextResponse.json({ ok: true, marked: updated.length });
}
