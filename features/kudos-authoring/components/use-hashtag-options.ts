"use client";

import { useCallback, useEffect, useState } from "react";
import type { HashtagOption } from "../schemas/kudo-edit-prefill";

export type HashtagOptionsState = {
  status: "loading" | "ready" | "error" | "unauthorized";
  options: HashtagOption[];
};

/**
 * Active hashtags from GET /api/hashtags (seed order, label in the cookie locale). Loaded once
 * per composer; `retry` reloads after a failure. Any 401 means the session expired.
 */
export function useHashtagOptions() {
  const [state, setState] = useState<HashtagOptionsState>({ status: "loading", options: [] });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/hashtags", { signal: controller.signal, headers: { accept: "application/json" } })
      .then(async (response) => {
        if (response.status === 401) return setState({ status: "unauthorized", options: [] });
        if (!response.ok) return setState({ status: "error", options: [] });
        setState({ status: "ready", options: (await response.json()) as HashtagOption[] });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error", options: [] });
      });
    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading", options: [] });
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, retry };
}
