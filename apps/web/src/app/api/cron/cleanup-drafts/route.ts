import { NextResponse } from "next/server";
import { prisma } from "@kol/database";

// GET /api/cron/cleanup-drafts — called by a cron job (e.g. Vercel Cron) to archive stale drafts
// Vercel Cron config: schedule = "0 2 * * *" (daily at 2am)
export async function GET(request: Request) {
  // Basic auth check — require CRON_SECRET to prevent unauthorized runs
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const STALE_DAYS = 30; // archive drafts older than 30 days
  const cutoff = new Date(Date.now() - STALE_DAYS * 86_400_000);

  const result = await prisma.videoProject.updateMany({
    where: {
      status: "draft",
      archivedAt: null,
      createdAt: { lt: cutoff },
    },
    data: { archivedAt: new Date() },
  });

  console.info(
    JSON.stringify({
      level: "info",
      event: "cron_cleanup_drafts",
      archived: result.count,
      staleDays: STALE_DAYS,
      ts: new Date().toISOString(),
    })
  );

  return NextResponse.json({ archived: result.count, staleDays: STALE_DAYS });
}
