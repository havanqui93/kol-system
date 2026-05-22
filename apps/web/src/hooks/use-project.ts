"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type Project, type Script, type Scene, type Asset, type CostTracking } from "@/lib/api/client";

type FullProject = Project & { scripts: Script[]; scenes: Scene[]; assets: Asset[]; costTracking: CostTracking | null };

const POLLING_STATUSES = new Set([
  "script_generating",
  "audio_generating",
  "video_generating",
  "rendering",
  "qa_checking",
  "publishing",
]);

export function useProject(projectId: string) {
  const [project, setProject] = useState<FullProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.projects.get(projectId);
      setProject(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-poll while project is in a processing state
  useEffect(() => {
    if (!project) return;
    if (!POLLING_STATUSES.has(project.status)) return;

    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [project?.status, refresh]);

  return { project, loading, error, refresh };
}
