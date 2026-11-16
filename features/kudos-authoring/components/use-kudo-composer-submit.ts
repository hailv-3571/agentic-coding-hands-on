"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  KudoInputSchema,
  KudoUpdateSchema,
  parseKudoInput,
  type KudoCreateInput,
  type KudoUpdateInput,
} from "../schemas/kudo-input-schema";
import type { KudoWriteFailure } from "../schemas/kudo-write-result";
import { createKudo } from "../server/create-kudo-action";
import { updateKudo } from "../server/update-kudo-action";

export type ComposerSubmission = { mode: "create"; input: KudoCreateInput } | { mode: "edit"; kudoId: string; input: KudoUpdateInput };

/**
 * Sends the composer (FR-403, FR-603). The same Zod schema the server runs checks the input
 * first, so DEC-001 and field errors appear without a round trip. A ref guard plus the disabled
 * button make a double click send exactly one action: the actions have no idempotency key, and
 * Next queues (does not drop) a second call. On success: `onSaved(id)` then `router.refresh()`
 * (the actions do not revalidate). A thrown call (network) maps to UNEXPECTED.
 */
export function useKudoComposerSubmit(onSaved: (id: string) => void) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const inFlight = useRef(false);
  const [failure, setFailure] = useState<KudoWriteFailure | null>(null);

  function submit(submission: ComposerSubmission) {
    if (inFlight.current) return;
    const parsed =
      submission.mode === "create"
        ? parseKudoInput(KudoInputSchema, submission.input)
        : parseKudoInput(KudoUpdateSchema, submission.input);
    if (!parsed.ok) {
      setFailure({ ok: false, code: parsed.code, fieldErrors: parsed.fieldErrors });
      return;
    }
    inFlight.current = true;
    setFailure(null);
    startTransition(async () => {
      try {
        const result =
          submission.mode === "create"
            ? await createKudo(submission.input)
            : await updateKudo(submission.kudoId, submission.input);
        if (result.ok) {
          onSaved(result.id);
          router.refresh();
        } else {
          setFailure(result);
        }
      } catch (error) {
        console.error("[kudos] composer submit failed", error);
        setFailure({ ok: false, code: "UNEXPECTED" });
      } finally {
        inFlight.current = false;
      }
    });
  }

  return { submit, pending, failure, clearFailure: () => setFailure(null) };
}
