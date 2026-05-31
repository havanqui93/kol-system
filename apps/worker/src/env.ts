const REQUIRED = [
  "DATABASE_URL",
  "REDIS_URL",
  "ANTHROPIC_API_KEY",
] as const;

const FEATURE_VARS: Array<{ key: string; feature: string }> = [
  { key: "ELEVENLABS_API_KEY", feature: "audio generation" },
  { key: "FAL_KEY", feature: "Kling video generation" },
  { key: "R2_BUCKET_NAME", feature: "cloud storage" },
];

export function validateWorkerEnv(): void {
  const missing = REQUIRED.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    const msg = [
      "FATAL: Missing required environment variables:",
      ...missing.map((v) => `  - ${v}`),
      "",
      "Copy .env.example to .env and fill in the values.",
    ].join("\n");
    process.stderr.write(msg + "\n");
    process.exit(1);
  }

  const disabledFeatures = FEATURE_VARS.filter((f) => !process.env[f.key]);
  if (disabledFeatures.length > 0) {
    const msg = [
      "WARN: Some features disabled (env vars not set):",
      ...disabledFeatures.map((f) => `  - ${f.key} → ${f.feature} disabled`),
    ].join("\n");
    process.stderr.write(msg + "\n");
  }
}
