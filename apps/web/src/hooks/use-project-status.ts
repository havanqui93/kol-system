"use client";

import { useEffect, useRef, useCallback } from "react";

interface StatusEvent {
  status: string;
  errorMessage?: string | null;
  finalVideoUrl?: string | null;
  projectId: string;
  ts: number;
}

interface UseProjectStatusOptions {
  projectId: string;
  onStatusChange: (event: StatusEvent) => void;
  enabled?: boolean;
}

const TERMINAL_STATUSES = new Set(["published", "failed", "ready_to_publish", "rendered"]);

export function useProjectStatus({ projectId, onStatusChange, enabled = true }: UseProjectStatusOptions) {
  const esRef = useRef<EventSource | null>(null);
  const onChangeRef = useRef(onStatusChange);
  onChangeRef.current = onStatusChange;

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(`/api/video-projects/${projectId}/stream`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as StatusEvent;
        onChangeRef.current(data);

        if (TERMINAL_STATUSES.has(data.status)) {
          es.close();
          esRef.current = null;
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
    };
  }, [projectId]);

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect, enabled]);
}
