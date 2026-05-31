"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `onVisible()` when the browser tab becomes visible again after being hidden.
 * Used to refresh project data when user switches back to the tab.
 */
export function usePageVisibilityRefresh(onVisible: () => void, minHiddenMs = 5000) {
  const hiddenAtRef = useRef<number | null>(null);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    function handler() {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else {
        const hiddenFor = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
        if (hiddenFor >= minHiddenMs) {
          onVisibleRef.current();
        }
        hiddenAtRef.current = null;
      }
    }

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [minHiddenMs]);
}
