"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface NoteVersion {
  text: string;
  savedAt: number;
}

const MAX_HISTORY = 20;
const STORAGE_PREFIX = "kol:notes:history:";

export function useNotesHistory(projectId: string) {
  const [history, setHistory] = useState<NoteVersion[]>([]);
  const storageKey = `${STORAGE_PREFIX}${projectId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const pushVersion = useCallback(
    (text: string) => {
      setHistory((prev) => {
        const last = prev[0];
        if (last?.text === text) return prev;
        const next = [{ text, savedAt: Date.now() }, ...prev].slice(0, MAX_HISTORY);
        try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [storageKey]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  return { history, pushVersion, clearHistory };
}
