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
const MAX_RETRIES = 8;
const BASE_DELAY_MS = 1000;

export function useProjectStatus({ projectId, onStatusChange, enabled = true }: UseProjectStatusOptions) {
  const esRef = useRef<EventSource | null>(null);
  const onChangeRef = useRef(onStatusChange);
  const retriesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  onChangeRef.current = onStatusChange;

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    esRef.current?.close();
    esRef.current = null;
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    cleanup();

    const es = new EventSource(`/api/video-projects/${projectId}/stream`);
    esRef.current = es;

    es.onmessage = (event) => {
      retriesRef.current = 0; // reset on successful message
      try {
        const data = JSON.parse(event.data) as StatusEvent;
        onChangeRef.current(data);

        if (TERMINAL_STATUSES.has(data.status)) {
          cleanup();
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;

      if (!mountedRef.current) return;
      if (retriesRef.current >= MAX_RETRIES) return;

      const delay = Math.min(BASE_DELAY_MS * 2 ** retriesRef.current, 30_000);
      retriesRef.current += 1;

      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    };
  }, [projectId, cleanup]);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) return;

    retriesRef.current = 0;
    connect();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [connect, enabled, cleanup]);
}
