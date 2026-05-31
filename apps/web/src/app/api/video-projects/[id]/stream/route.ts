import { prisma } from "@kol/database";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/video-projects/:id/stream — SSE endpoint for real-time project status
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id: projectId } = params;
  const userId = request.headers.get("x-user-id") ?? "demo-user";

  const project = await prisma.videoProject.findFirst({
    where: { id: projectId, userId },
    select: { id: true, status: true },
  });

  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastStatus = project.status;
      let active = true;

      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial state
      send({ status: lastStatus, projectId, ts: Date.now() });

      // Subscribe to Redis keyspace notifications for status changes
      const subscriber = redis.duplicate();

      const cleanup = () => {
        active = false;
        subscriber.quit().catch(() => {});
        controller.close();
      };

      request.signal.addEventListener("abort", cleanup);

      // Poll DB for status changes (Redis pub/sub requires keyspace notifications config)
      const poll = async () => {
        while (active) {
          await new Promise((r) => setTimeout(r, 2000));
          if (!active) break;

          try {
            const current = await prisma.videoProject.findUnique({
              where: { id: projectId },
              select: { status: true, errorMessage: true, finalVideoUrl: true },
            });

            if (!current) break;

            if (current.status !== lastStatus) {
              lastStatus = current.status;
              send({
                status: current.status,
                errorMessage: current.errorMessage,
                finalVideoUrl: current.finalVideoUrl,
                projectId,
                ts: Date.now(),
              });
            }

            // Stop polling once in a terminal state
            const terminal = ["published", "failed", "ready_to_publish"];
            if (terminal.includes(current.status)) {
              await new Promise((r) => setTimeout(r, 1000));
              cleanup();
              break;
            }
          } catch {
            break;
          }
        }
      };

      subscriber.quit().catch(() => {});
      poll();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
