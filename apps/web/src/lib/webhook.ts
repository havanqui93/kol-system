import { redis } from "./redis";

const WEBHOOK_KEY_PREFIX = "webhook:url:";

export async function setWebhookUrl(userId: string, url: string): Promise<void> {
  await redis.set(`${WEBHOOK_KEY_PREFIX}${userId}`, url);
}

export async function getWebhookUrl(userId: string): Promise<string | null> {
  return redis.get(`${WEBHOOK_KEY_PREFIX}${userId}`);
}

export async function clearWebhookUrl(userId: string): Promise<void> {
  await redis.del(`${WEBHOOK_KEY_PREFIX}${userId}`);
}

export interface WebhookPayload {
  event: "project.completed" | "project.failed" | "project.published";
  projectId: string;
  userId: string;
  status: string;
  finalVideoUrl?: string | null;
  totalCostUsd?: number | null;
  ts: string;
}

export async function fireWebhook(userId: string, payload: WebhookPayload): Promise<void> {
  const url = await getWebhookUrl(userId);
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("[webhook] delivery failed", { url, error: String(err) });
  }
}
