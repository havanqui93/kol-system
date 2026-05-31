"use client";

import { useCallback, useReducer } from "react";

type AsyncState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string };

type AsyncAction<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "error"; error: string }
  | { type: "reset" };

function reducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case "start": return { status: "loading", data: null, error: null };
    case "success": return { status: "success", data: action.data, error: null };
    case "error": return { status: "error", data: null, error: action.error };
    case "reset": return { status: "idle", data: null, error: null };
  }
}

export function useAsync<T>() {
  const [state, dispatch] = useReducer(reducer<T>, { status: "idle", data: null, error: null });

  const run = useCallback(async (promise: Promise<T>): Promise<T | null> => {
    dispatch({ type: "start" });
    try {
      const data = await promise;
      dispatch({ type: "success", data });
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      dispatch({ type: "error", error: msg });
      return null;
    }
  }, []);

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return { ...state, run, reset, isLoading: state.status === "loading" };
}
