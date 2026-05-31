import { NextResponse } from "next/server";
import { z } from "zod";
import { redis } from "@/lib/redis";

const PREF_KEY_PREFIX = "user:prefs:";
const PREF_TTL = 365 * 86400; // 1 year

interface UserPreferences {
  defaultPlatform?: string;
  defaultQualityPreset?: string;
  defaultLanguage?: string;
  defaultDurationSeconds?: number;
  preferredVoiceStyle?: string;
  emailNotifications?: boolean;
}

const PrefsSchema = z.object({
  defaultPlatform: z.enum(["tiktok", "facebook", "instagram", "youtube_shorts"]).optional(),
  defaultQualityPreset: z.enum(["cheap", "balanced", "premium"]).optional(),
  defaultLanguage: z.string().length(2).optional(),
  defaultDurationSeconds: z.number().int().min(15).max(60).optional(),
  preferredVoiceStyle: z.enum(["energetic", "professional", "funny", "calm", "authoritative"]).optional(),
  emailNotifications: z.boolean().optional(),
});

// GET /api/user/preferences
export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const raw = await redis.get(`${PREF_KEY_PREFIX}${userId}`);
  const prefs: UserPreferences = raw ? JSON.parse(raw) : {};
  return NextResponse.json({ preferences: prefs });
}

// PATCH /api/user/preferences — partial update
export async function PATCH(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  const body = await request.json();
  const updates = PrefsSchema.parse(body);

  const raw = await redis.get(`${PREF_KEY_PREFIX}${userId}`);
  const current: UserPreferences = raw ? JSON.parse(raw) : {};
  const merged = { ...current, ...updates };

  await redis.setex(`${PREF_KEY_PREFIX}${userId}`, PREF_TTL, JSON.stringify(merged));
  return NextResponse.json({ preferences: merged });
}

// DELETE /api/user/preferences — reset to defaults
export async function DELETE(request: Request) {
  const userId = request.headers.get("x-user-id") ?? "demo-user";
  await redis.del(`${PREF_KEY_PREFIX}${userId}`);
  return NextResponse.json({ preferences: {} });
}
