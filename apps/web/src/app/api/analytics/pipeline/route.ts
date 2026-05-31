import { NextResponse } from "next/server";
import { prisma } from "@kol/database";
import { handleApiError } from "@/lib/api-error";

// Pipeline analytics — conversion rates between statuses
export async function GET(request: Request) {
  try {
    const userId = request.headers.get("x-user-id") ?? "demo-user";
    const { searchParams } = new URL(request.url);
    const days = Math.min(90, parseInt(searchParams.get("days") ?? "30", 10));

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const statusGroups = await prisma.videoProject.groupBy({
      by: ["status"],
      where: { userId, createdAt: { gte: since } },
      _count: { id: true },
    });

    const byStatus = Object.fromEntries(statusGroups.map((s) => [s.status, s._count.id]));

    const total = statusGroups.reduce((s, r) => s + r._count.id, 0);
    const drafted = total;
    const scripted = statusGroups
      .filter((s) => ["script_ready", "script_approved", "audio_generating", "audio_ready", "video_generating", "clips_ready", "rendering", "rendered", "qa_checking", "ready_to_publish", "publishing", "published"].includes(s.status))
      .reduce((s, r) => s + r._count.id, 0);
    const audioDone = statusGroups
      .filter((s) => ["audio_ready", "video_generating", "clips_ready", "rendering", "rendered", "qa_checking", "ready_to_publish", "publishing", "published"].includes(s.status))
      .reduce((s, r) => s + r._count.id, 0);
    const rendered = statusGroups
      .filter((s) => ["rendered", "qa_checking", "ready_to_publish", "publishing", "published"].includes(s.status))
      .reduce((s, r) => s + r._count.id, 0);
    const published = byStatus["published"] ?? 0;

    const conversionRates = {
      draftToScript: drafted > 0 ? ((scripted / drafted) * 100).toFixed(1) : "0",
      scriptToAudio: scripted > 0 ? ((audioDone / scripted) * 100).toFixed(1) : "0",
      audioToRender: audioDone > 0 ? ((rendered / audioDone) * 100).toFixed(1) : "0",
      renderToPublish: rendered > 0 ? ((published / rendered) * 100).toFixed(1) : "0",
      overallCompletion: drafted > 0 ? ((published / drafted) * 100).toFixed(1) : "0",
    };

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      byStatus,
      funnelCounts: { drafted, scripted, audioDone, rendered, published },
      conversionRates,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
