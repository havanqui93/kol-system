"use client";

import { useRef, useState, useCallback } from "react";

/**
 * Prevents double-submit by tracking in-flight state.
 * Returns a wrapped async function that no-ops if already in flight.
 */
export function useSubmitOnce<T extends unknown[]>(
  fn: (...args: T) => Promise<void>
): [(...args: T) => Promise<void>, boolean] {
  const inFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const wrapped = useCallback(
    async (...args: T) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setSubmitting(true);
      try {
        await fn(...args);
      } finally {
        inFlight.current = false;
        setSubmitting(false);
      }
    },
    [fn]
  );

  return [wrapped, submitting];
}
