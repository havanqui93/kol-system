// URL utilities — safe URL construction and validation

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function isR2Url(url: string): boolean {
  const r2PublicUrl = process.env.R2_PUBLIC_URL ?? "";
  return r2PublicUrl !== "" && url.startsWith(r2PublicUrl);
}

export function buildShareUrl(token: string, baseUrl?: string): string {
  const base = baseUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/share/${token}`;
}

export function sanitizeRedirectUrl(redirectTo: string | null, defaultUrl = "/"): string {
  if (!redirectTo) return defaultUrl;
  // Only allow relative URLs or same-origin URLs
  try {
    const url = new URL(redirectTo, "http://localhost");
    if (url.hostname !== "localhost" && url.protocol !== "http:") return defaultUrl;
    return redirectTo.startsWith("/") ? redirectTo : defaultUrl;
  } catch {
    return defaultUrl;
  }
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const filtered = Object.entries(params)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => [k, String(v)]);
  return new URLSearchParams(filtered).toString();
}

export function extractProjectId(url: string): string | null {
  const match = url.match(/\/projects\/([a-zA-Z0-9_-]+)/);
  return match?.[1] ?? null;
}
