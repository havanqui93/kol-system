type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
  [key: string]: unknown;
}

function log(level: LogLevel, msg: string, ctx: Record<string, unknown> = {}) {
  const entry: LogEntry = {
    level,
    msg,
    ts: new Date().toISOString(),
    pid: process.pid,
    ...ctx,
  };

  const line = JSON.stringify(entry);

  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),

  child: (defaultCtx: Record<string, unknown>) => ({
    debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, { ...defaultCtx, ...ctx }),
    info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, { ...defaultCtx, ...ctx }),
    warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, { ...defaultCtx, ...ctx }),
    error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, { ...defaultCtx, ...ctx }),
  }),
};
