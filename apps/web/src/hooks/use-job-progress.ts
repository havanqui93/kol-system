"use client";

import { useEffect, useState, useRef } from "react";

interface JobProgress {
  worker: string;
  jobId: string;
  progress: number | object;
}

export function useJobProgress(projectId: string, enabled: boolean) {
  const [jobs, setJobs] = useState<JobProgress[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setJobs([]);
      return;
    }

    async function poll() {
      try {
        const res = await fetch(`/api/video-projects/${projectId}/progress`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data.activeJobs ?? []);
        }
      } catch {
        // ignore
      }
    }

    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [projectId, enabled]);

  const overallProgress =
    jobs.length === 0
      ? 0
      : Math.round(
          jobs.reduce((sum, j) => sum + (typeof j.progress === "number" ? j.progress : 0), 0) /
            jobs.length
        );

  return { jobs, overallProgress };
}
