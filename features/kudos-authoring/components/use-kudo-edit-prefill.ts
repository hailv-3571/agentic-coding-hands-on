"use client";

import { useEffect, useState } from "react";
import type { KudoEditPrefill } from "../schemas/kudo-edit-prefill";
import { KUDO_ERROR_STATUS, type KudoErrorCode } from "../schemas/kudo-write-result";

export type KudoEditPrefillState =
  | { status: "loading" }
  | { status: "ready"; prefill: KudoEditPrefill }
  | { status: "error"; code: KudoErrorCode };

const isKudoErrorCode = (code: unknown): code is KudoErrorCode => typeof code === "string" && code in KUDO_ERROR_STATUS;

/**
 * GET /api/kudos/{id}/edit (owner only). Error bodies carry only `{ code }`; any 401 is a lost
 * session (the proxy answers lowercase "unauthorized"), anything unknown is UNEXPECTED.
 */
export function useKudoEditPrefill(kudoId: string): KudoEditPrefillState {
  const [loaded, setLoaded] = useState<{ kudoId: string; state: KudoEditPrefillState } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const settle = (state: KudoEditPrefillState) => setLoaded({ kudoId, state });
    fetch(`/api/kudos/${encodeURIComponent(kudoId)}/edit`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { accept: "application/json" },
    })
      .then(async (response) => {
        if (response.ok) return settle({ status: "ready", prefill: (await response.json()) as KudoEditPrefill });
        if (response.status === 401) return settle({ status: "error", code: "UNAUTHENTICATED" });
        const { code } = (await response.json().catch(() => ({}))) as { code?: unknown };
        settle({ status: "error", code: isKudoErrorCode(code) ? code : "UNEXPECTED" });
      })
      .catch(() => {
        if (!controller.signal.aborted) settle({ status: "error", code: "UNEXPECTED" });
      });
    return () => controller.abort();
  }, [kudoId]);

  return loaded?.kudoId === kudoId ? loaded.state : { status: "loading" };
}
