const REQUIRED_VARS = [
  "DATABASE_URL",
  "REDIS_URL",
  "ANTHROPIC_API_KEY",
] as const;

const OPTIONAL_VARS = [
  "OPENAI_API_KEY",
  "ELEVENLABS_API_KEY",
  "FAL_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join("\n")}\n\nCopy .env.example to .env and fill in the values.`
    );
  }
}

export function warnOptionalEnv(): void {
  const missing = OPTIONAL_VARS.filter((v) => !process.env[v]);
  if (missing.length > 0 && process.env.NODE_ENV !== "test") {
    console.warn(
      `[env] Optional env vars not set (some features will be disabled):\n${missing.map((v) => `  - ${v}`).join("\n")}`
    );
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  openaiApiKey: process.env.OPENAI_API_KEY,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
  falKey: process.env.FAL_KEY,
  nodeEnv: (process.env.NODE_ENV ?? "development") as "development" | "production" | "test",
} as const;
