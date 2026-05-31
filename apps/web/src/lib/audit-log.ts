// Structured audit logging for security-sensitive operations

type AuditAction =
  | "project.create"
  | "project.delete"
  | "project.archive"
  | "project.restore"
  | "project.publish"
  | "project.bulk_delete"
  | "project.bulk_archive"
  | "script.approve"
  | "script.generate"
  | "social.connect"
  | "social.disconnect"
  | "upload.file"
  | "auth.login"
  | "auth.logout";

interface AuditEntry {
  action: AuditAction;
  userId: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  ts: string;
}

export function auditLog(entry: Omit<AuditEntry, "ts">) {
  const log: AuditEntry = {
    ...entry,
    ts: new Date().toISOString(),
  };

  // In production: send to a log aggregator (e.g. Datadog, CloudWatch, Sentry)
  console.log(JSON.stringify({ level: "audit", ...log }));
}

export function extractRequestMeta(request: Request): { ip: string | null; userAgent: string | null } {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;
  return { ip, userAgent };
}
