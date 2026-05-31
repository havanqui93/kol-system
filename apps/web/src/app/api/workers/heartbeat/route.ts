import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const HEARTBEAT_TTL = 90; // seconds — worker must ping every 30s or considered dead

// POST /api/workers/heartbeat — workers call this to register they're alive
export async function POST(request: Request) {
  const { workerId, workerType, version } = await request.json().catch(() => ({}));
  if (!workerId) return NextResponse.json({ error: "workerId required" }, { status: 400 });

  const key = `worker:heartbeat:${workerId}`;
  await redis.setex(
    key,
    HEARTBEAT_TTL,
    JSON.stringify({ workerId, workerType, version, ts: Date.now() })
  );

  return NextResponse.json({ ok: true, ttl: HEARTBEAT_TTL });
}

// GET /api/workers/heartbeat — list all live workers
export async function GET() {
  const keys = await redis.keys("worker:heartbeat:*");

  const workers = await Promise.all(
    keys.map(async (key) => {
      const [val, ttl] = await Promise.all([redis.get(key), redis.ttl(key)]);
      try {
        return { ...JSON.parse(val!), ttlSeconds: ttl };
      } catch {
        return null;
      }
    })
  );

  const live = workers.filter(Boolean);
  return NextResponse.json({ count: live.length, workers: live });
}
