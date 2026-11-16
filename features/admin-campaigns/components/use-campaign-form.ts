"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { unstable_rethrow } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CampaignActionResult, CampaignListItem } from "../schemas/campaign-admin-result";
import {
  CampaignCreateSchema,
  CampaignUpdateSchema,
  campaignFieldErrors,
  type CampaignField,
  type CampaignFieldErrors,
} from "../schemas/campaign-input-schema";
import { createCampaign, updateCampaign } from "../server/campaign-admin-actions";

export type CampaignFormTarget = { mode: "add" } | { mode: "edit"; campaign: CampaignListItem };

/** How a dialog ended, for the page toast: saved / deleted, or the row is gone or ended (table reloaded). */
export type CampaignDialogOutcome = { kind: "saved"; mode: "add" | "edit" } | { kind: "deleted" } | { kind: "gone"; code: "NOT_FOUND" | "ENDED" };

type FieldValues = Record<CampaignField, string>;
const FIELD_ORDER: CampaignField[] = ["name", "startsAt", "endsAt"];

/** Calls a campaign action; a thrown action or a network failure becomes UNEXPECTED (403/redirect pass through). */
async function runCampaignAction(action: () => Promise<CampaignActionResult>): Promise<CampaignActionResult> {
  try {
    return await action();
  } catch (error) {
    unstable_rethrow(error);
    console.warn("[admin-campaigns] saving the campaign failed", error);
    return { ok: false, code: "UNEXPECTED" };
  }
}

/**
 * State and submit flow of the Add/Edit campaign form (F011 FR-301..FR-307). Early checks on the
 * client (the shared Zod schema + end after start: same zone and fixed-width values, so string order
 * is time order); everything else is the server's answer: field keys → `errors.fields.<key>`,
 * OVERLAP → under End Date naming the other campaign, NOT_FOUND / ENDED → close with a page toast,
 * anything else → the form-level "Không lưu được" with the input kept. An active campaign's start
 * is locked and left out of the update (DEC-002).
 */
export function useCampaignForm(target: CampaignFormTarget, onDone: (outcome: CampaignDialogOutcome) => void) {
  const t = useTranslations("adminCampaigns.errors");
  const campaign = target.mode === "edit" ? target.campaign : null;
  const startLocked = campaign?.phase === "active";
  const [values, setValues] = useState<FieldValues>(() =>
    campaign ? { name: campaign.name, startsAt: campaign.startsAtLocal, endsAt: campaign.endsAtLocal } : { name: "", startsAt: "", endsAt: "" },
  );
  const [errors, setErrors] = useState<Partial<FieldValues>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);
  const startsAtRef = useRef<HTMLInputElement>(null);
  const endsAtRef = useRef<HTMLInputElement>(null);
  const inputs = { name: nameRef, startsAt: startsAtRef, endsAt: endsAtRef };

  function setField(field: CampaignField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    // Typing clears that field's message; a new start may also settle the end's (order, overlap).
    setErrors((current) => ({ ...current, [field]: undefined, ...(field === "startsAt" ? { endsAt: undefined } : {}) }));
  }

  /** Shows the messages and moves focus to the first field in error (read out with its message). */
  function reveal(messages: Partial<FieldValues>) {
    setErrors(messages);
    const first = FIELD_ORDER.find((field) => messages[field]);
    if (first) inputs[first].current?.focus();
  }

  function revealKeys(fieldErrors: CampaignFieldErrors) {
    const messages: Partial<FieldValues> = {};
    for (const field of FIELD_ORDER) {
      const key = fieldErrors[field]?.[0];
      if (key) messages[field] = t(`fields.${key}`);
    }
    if (Object.keys(messages).length === 0) return setFormError(t("VALIDATION"));
    reveal(messages);
  }

  const send = campaign
    ? () => updateCampaign({ id: campaign.id, name: values.name, endsAt: values.endsAt, ...(startLocked ? {} : { startsAt: values.startsAt }) })
    : () => createCampaign({ name: values.name, startsAt: values.startsAt, endsAt: values.endsAt });

  function localErrors(): CampaignFieldErrors {
    const parsed = campaign
      ? CampaignUpdateSchema.safeParse({ id: campaign.id, ...values })
      : CampaignCreateSchema.safeParse(values);
    const found = parsed.success ? {} : campaignFieldErrors(parsed.error.issues);
    if (!found.startsAt && !found.endsAt && values.endsAt <= values.startsAt) found.endsAt = ["endBeforeStart"];
    return found;
  }

  function handle(result: CampaignActionResult) {
    if (result.ok) return onDone({ kind: "saved", mode: target.mode });
    if (result.code === "VALIDATION") return revealKeys(result.fieldErrors);
    if (result.code === "OVERLAP") return reveal({ endsAt: result.conflict ? t("overlapWith", result.conflict) : t("OVERLAP") });
    if (result.code === "NOT_FOUND" || result.code === "ENDED") return onDone({ kind: "gone", code: result.code });
    setFormError(t("UNEXPECTED"));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    const local = localErrors();
    if (Object.keys(local).length > 0) return revealKeys(local);
    setErrors({});
    startTransition(async () => {
      const result = await runCampaignAction(send);
      startTransition(() => handle(result));
    });
  }

  return { values, errors, formError, pending, startLocked, inputs, setField, submit };
}
