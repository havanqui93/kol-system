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

export interface CostTracking {
  llmCostUsd: string;
  ttsCostUsd: string;
  videoCostUsd: string;
  subtitleCostUsd: string;
  storageCostUsd: string;
  totalCostUsd: string;
  budgetLimitUsd: string | null;
}

export interface Project {
  id: string;
  title: string | null;
  videoType: string;
  platform: string;
  language: string;
  durationSeconds: number;
  qualityPreset: string;
  status: string;
  errorMessage: string | null;
  finalVideoUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { name: string } | null;
  kolProfile?: { name: string } | null;
  costTracking?: CostTracking[] | null;
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

export interface Scene {
  id: string;
  sceneIndex: number;
  visualType: string;
  durationSeconds: number;
  status: string;
  clipUrl: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrls: string[];
}

export interface KolProfile {
  id: string;
  name: string;
  avatarImageUrl: string;
  voiceGender: string;
  voiceStyle: string;
  language: string;
}

// ─── Project APIs ─────────────────────────────────────────────────────────────

export interface CreateProjectPayload {
  title?: string;
  videoType?: string;
  platform?: string;
  language?: string;
  durationSeconds?: number;
  qualityPreset?: "cheap" | "balanced" | "premium";
  brandTone?: string;
  productId?: string;
  kolProfileId?: string;
}

export const api = {
  uploads: {
    file: async (file: File, purpose: "avatar" | "product" | "music" | "asset" = "asset") => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", purpose);

      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { "x-user-id": DEMO_USER_ID },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).error ?? `HTTP ${res.status}`);
      }

      return res.json() as Promise<{ url: string; key: string; contentType: string; sizeBytes: number }>;
    },
    image: (file: File, purpose: "avatar" | "product" | "asset" = "asset") => api.uploads.file(file, purpose),
    music: (file: File) => api.uploads.file(file, "music"),
  },

  products: {
    create: (data: {
      name: string;
      description?: string;
      price?: string;
      promotion?: string;
      targetCustomer?: string;
      category?: string;
      imageUrls?: string[];
    }) => apiFetch<Product>("/api/products", { method: "POST", body: JSON.stringify(data) }),
  },

  kolProfiles: {
    list: () => apiFetch<{ kolProfiles: KolProfile[] }>("/api/kol-profiles"),
    create: (data: {
      name: string;
      description?: string;
      avatarImageUrl: string;
      voiceGender?: "male" | "female";
      voiceStyle?: "energetic" | "professional" | "funny" | "calm" | "authoritative";
      language?: string;
      stylePrompt?: string;
    }) => apiFetch<KolProfile>("/api/kol-profiles", { method: "POST", body: JSON.stringify(data) }),
  },

  projects: {
    list: () => apiFetch<{ projects: Project[]; total: number }>("/api/video-projects"),
    get: (id: string) => apiFetch<Project & { scripts: Script[]; scenes: Scene[]; assets: Asset[]; costTracking: CostTracking[] }>(`/api/video-projects/${id}`),
    create: (data: CreateProjectPayload) =>
      apiFetch<Project>("/api/video-projects", { method: "POST", body: JSON.stringify(data) }),
    duplicate: (id: string) =>
      apiFetch<Project>(`/api/video-projects/${id}/duplicate`, { method: "POST", body: "{}" }),
  },

  script: {
    generate: (projectId: string) =>
      apiFetch<{ jobId: string }>(`/api/video-projects/${projectId}/generate-script`, { method: "POST", body: "{}" }),
    regenerate: (projectId: string, feedback?: string) =>
      apiFetch<{ jobId: string }>(`/api/video-projects/${projectId}/regenerate-script`, {
        method: "POST",
        body: JSON.stringify({ feedback }),
      }),
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

  kling: {
    generate: (projectId: string) =>
      apiFetch<{ jobIds: string[]; sceneCount: number; klingJobCount: number }>(
        `/api/video-projects/${projectId}/generate-kling-clips`,
        { method: "POST", body: "{}" }
      ),
  },

  render: {
    start: (projectId: string, opts?: { backgroundMusicUrl?: string }) =>
      apiFetch<{ jobId: string; renderJobId: string }>(`/api/video-projects/${projectId}/render`, {
        method: "POST",
        body: JSON.stringify(opts ?? {}),
      }),
    getJob: (renderJobId: string) =>
      apiFetch<{ status: string; outputUrl: string | null; errorMessage: string | null }>(`/api/render-jobs/${renderJobId}`),
  },
};
