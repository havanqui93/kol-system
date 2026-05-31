import { NextResponse } from "next/server";
import { queues } from "@/lib/queues";

export async function GET() {
  const queueList = [
    { name: "Script", q: queues.generateScript },
    { name: "Audio", q: queues.generateAudio },
    { name: "Kling Video", q: queues.generateKlingVideo },
    { name: "Subtitle", q: queues.generateSubtitle },
    { name: "Render", q: queues.renderVideo },
    { name: "QA", q: queues.qaVideo },
    { name: "Publish", q: queues.publishVideo },
  ];

  const stats = await Promise.all(
    queueList.map(async ({ name, q }) => {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        q.getWaitingCount(),
        q.getActiveCount(),
        q.getCompletedCount(),
        q.getFailedCount(),
        q.getDelayedCount(),
      ]);
      return { name, waiting, active, completed, failed, delayed };
    })
  );

  return NextResponse.json({ stats });
}
