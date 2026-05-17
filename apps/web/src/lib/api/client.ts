// Thin API client — all calls use x-user-id: demo-user for MVP (replace with real auth)

const DEMO_USER_ID = "demo-user";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": DEMO_USER_ID,
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types (mirrors Prisma models) ───────────────────────────────────────────

export interface Project {
  id: string;
  title: string | null;
  videoType: string;
  platform: string;
  language: string;
  durationSeconds: number;
  status: string;
  errorMessage: string | null;
  finalVideoUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { name: string } | null;
  kolProfile?: { name: string } | null;
}

export interface Script {
  id: string;
  version: number;
  isApproved: boolean;
  hook: string;
  problem: string | null;
  introduction: string | null;
  benefits: string | null;
  proof: string | null;
  offer: string | null;
  cta: string;
  fullScript: string;
  wordCount: number | null;
  estimatedDurationSeconds: number | null;
  createdAt: string;
}

export interface Asset {
  id: string;
  assetType: string;
  url: string;
  durationMs: number | null;
  createdAt: string;
}

// ─── Project APIs ─────────────────────────────────────────────────────────────

export interface CreateProjectPayload {
  title?: string;
  videoType?: string;
  platform?: string;
  language?: string;
  durationSeconds?: number;
  brandTone?: string;
  productId?: string;
  kolProfileId?: string;
}

export const api = {
  projects: {
    list: () => apiFetch<{ projects: Project[]; total: number }>("/api/video-projects"),
    get: (id: string) => apiFetch<Project & { scripts: Script[]; assets: Asset[] }>(`/api/video-projects/${id}`),
    create: (data: CreateProjectPayload) =>
      apiFetch<Project>("/api/video-projects", { method: "POST", body: JSON.stringify(data) }),
  },

  script: {
    generate: (projectId: string) =>
      apiFetch<{ jobId: string }>(`/api/video-projects/${projectId}/generate-script`, { method: "POST", body: "{}" }),
    approve: (projectId: string, scriptId: string) =>
      apiFetch(`/api/video-projects/${projectId}/approve-script`, {
        method: "POST",
        body: JSON.stringify({ scriptId }),
      }),
  },

  audio: {
    generate: (projectId: string, opts?: { voiceGender?: string; voiceStyle?: string }) =>
      apiFetch<{ jobId: string }>(`/api/video-projects/${projectId}/generate-audio`, {
        method: "POST",
        body: JSON.stringify(opts ?? {}),
      }),
  },

  render: {
    start: (projectId: string) =>
      apiFetch<{ jobId: string; renderJobId: string }>(`/api/video-projects/${projectId}/render`, {
        method: "POST",
        body: "{}",
      }),
    getJob: (renderJobId: string) =>
      apiFetch<{ status: string; outputUrl: string | null; errorMessage: string | null }>(`/api/render-jobs/${renderJobId}`),
  },
};
