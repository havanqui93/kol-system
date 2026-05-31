"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type Project, type Script, type Scene, type Asset } from "@/lib/api/client";
import { useProjectStatus } from "./use-project-status";

type FullProject = Project & { scripts: Script[]; scenes: Scene[]; assets: Asset[] };

const PROCESSING_STATUSES = new Set([
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

  // Use SSE for real-time updates while processing; fall back to polling otherwise
  const isProcessing = project ? PROCESSING_STATUSES.has(project.status) : false;

  useProjectStatus({
    projectId,
    enabled: isProcessing,
    onStatusChange: (event) => {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: event.status,
          errorMessage: event.errorMessage ?? prev.errorMessage,
          finalVideoUrl: event.finalVideoUrl ?? prev.finalVideoUrl,
        };
      });

      // Refresh full data when status changes to pick up new scripts/assets
      refresh();
    },
  });

  return { project, loading, error, refresh };
}
