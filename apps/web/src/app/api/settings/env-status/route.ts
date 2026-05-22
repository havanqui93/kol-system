import { NextResponse } from "next/server";

// GET /api/settings/env-status — reports which API keys are configured (not their values)
export async function GET() {
  const checks = {
    ANTHROPIC_API_KEY:     Boolean(process.env.ANTHROPIC_API_KEY),
    OPENAI_API_KEY:        Boolean(process.env.OPENAI_API_KEY),
    ELEVENLABS_API_KEY:    Boolean(process.env.ELEVENLABS_API_KEY),
    FAL_API_KEY:           Boolean(process.env.FAL_API_KEY),
    DATABASE_URL:          Boolean(process.env.DATABASE_URL),
    REDIS_URL:             Boolean(process.env.REDIS_URL),
    AWS_ACCESS_KEY_ID:     Boolean(process.env.AWS_ACCESS_KEY_ID),
    AWS_SECRET_ACCESS_KEY: Boolean(process.env.AWS_SECRET_ACCESS_KEY),
    S3_BUCKET:             Boolean(process.env.S3_BUCKET),
    TIKTOK_CLIENT_KEY:     Boolean(process.env.TIKTOK_CLIENT_KEY),
    FACEBOOK_APP_ID:       Boolean(process.env.FACEBOOK_APP_ID),
    GOOGLE_CLIENT_ID:      Boolean(process.env.GOOGLE_CLIENT_ID),
  };

  const required = ["ANTHROPIC_API_KEY", "DATABASE_URL", "REDIS_URL", "AWS_ACCESS_KEY_ID", "S3_BUCKET"];
  const missingRequired = required.filter((k) => !checks[k as keyof typeof checks]);

  return NextResponse.json({ checks, missingRequired, ready: missingRequired.length === 0 });
}
