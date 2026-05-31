import { NextResponse } from "next/server";
import { z } from "zod";
import { setWebhookUrl, getWebhookUrl, clearWebhookUrl, fireWebhook } from "@/lib/webhook";

const WebhookSchema = z.object({
  url: z.string().url().max(2000).optional(),
});

// GET /api/webhooks/test — get current webhook URL
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const url = await getWebhookUrl(userId);
  return NextResponse.json({ webhookUrl: url });
}

// POST /api/webhooks/test — set webhook URL and send a test ping
export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const body = await request.json();
  const { url } = WebhookSchema.parse(body);

  if (!url) {
    await clearWebhookUrl(userId);
    return NextResponse.json({ ok: true, webhookUrl: null });
  }

  await setWebhookUrl(userId, url);

  // Fire a test event
  await fireWebhook(userId, {
    event: "project.completed",
    projectId: "test-project-id",
    userId,
    status: "ready_to_publish",
    finalVideoUrl: null,
    totalCostUsd: 0,
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, webhookUrl: url, testFired: true });
}

// DELETE /api/webhooks/test — remove webhook
export async function DELETE(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  await clearWebhookUrl(userId);
  return NextResponse.json({ ok: true });
}
