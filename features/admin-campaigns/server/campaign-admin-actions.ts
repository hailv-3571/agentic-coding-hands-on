"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { zonedDateTimeToUtc } from "@/shared/admin/timezone";
import { requireAdmin } from "@/shared/auth/admin-guard";
import type { DbTx } from "@/shared/db/client";
import { campaigns } from "@/shared/db/schema";
import type { CampaignActionFailure, CampaignActionResult } from "../schemas/campaign-admin-result";
import {
  CampaignCreateSchema,
  CampaignUpdateSchema,
  campaignFieldErrors,
  campaignWindowErrors,
  type CampaignCreateInput,
  type CampaignFieldErrors,
  type CampaignUpdateInput,
} from "../schemas/campaign-input-schema";
import { CampaignOverlapCheck, type CampaignWindow } from "./campaign-overlap-check";
import { campaignPhase } from "./campaign-phase";
import { CampaignWriteError, lockCampaignRow, runCampaignWrite, type CampaignWriteAttempt } from "./campaign-write-transaction";

/**
 * Campaign admin Server Actions (F011 A2–A4, C-18). Untrusted POST entry points: `requireAdmin()`
 * runs FIRST (DB role check; non-admin → 403 `forbidden()`, guest → /login) before any read or
 * write. Instants arrive as datetime-local strings read in ADMIN_TIMEZONE and are stored in UTC.
 * Update and delete re-read the row in the write transaction and recompute the phase from the
 * server clock — never the phase the browser saw (BR-004). Hard delete (D008).
 */
const invalid = (fieldErrors: CampaignFieldErrors): CampaignActionFailure => ({ ok: false, code: "VALIDATION", fieldErrors });
const sameMinute = (a: Date, b: Date) => Math.floor(a.getTime() / 60_000) === Math.floor(b.getTime() / 60_000);

async function assertNoOverlap(tx: DbTx, window: CampaignWindow, excludeId?: number): Promise<void> {
  const conflict = await CampaignOverlapCheck.find(tx, window, excludeId);
  if (conflict) throw new CampaignWriteError({ ok: false, code: "OVERLAP", conflict });
}

/** Add Campaign. A start in the past is allowed (D005); the end must be after the start and after now. */
export async function createCampaign(input: CampaignCreateInput): Promise<CampaignActionResult> {
  await requireAdmin();
  const parsed = CampaignCreateSchema.safeParse(input);
  if (!parsed.success) return invalid(campaignFieldErrors(parsed.error.issues));
  const window = { startsAt: zonedDateTimeToUtc(parsed.data.startsAt), endsAt: zonedDateTimeToUtc(parsed.data.endsAt) };
  const windowErrors = campaignWindowErrors(window, new Date());
  if (windowErrors) return invalid(windowErrors);

  return runCampaignWrite({ window }, async (tx) => {
    await assertNoOverlap(tx, window);
    const [row] = await tx.insert(campaigns).values({ name: parsed.data.name, ...window }).returning({ id: campaigns.id });
    return row.id;
  });
}

/**
 * Edit Campaign. ended → ENDED; active → name + end only (a different start minute → startLocked,
 * DEC-002); upcoming → all three. An omitted `startsAt` keeps the stored one.
 */
export async function updateCampaign(input: CampaignUpdateInput): Promise<CampaignActionResult> {
  await requireAdmin();
  const parsed = CampaignUpdateSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = campaignFieldErrors(parsed.error.issues);
    return Object.keys(fieldErrors).length > 0 ? invalid(fieldErrors) : { ok: false, code: "NOT_FOUND" };
  }
  const { id, name } = parsed.data;
  const requestedStart = parsed.data.startsAt === undefined ? undefined : zonedDateTimeToUtc(parsed.data.startsAt);
  const endsAt = zonedDateTimeToUtc(parsed.data.endsAt);
  const attempt: CampaignWriteAttempt = { excludeId: id };

  return runCampaignWrite(attempt, async (tx) => {
    const row = await lockCampaignRow(tx, id);
    const now = new Date();
    const phase = campaignPhase(row, now);
    if (phase === "ended") throw new CampaignWriteError({ ok: false, code: "ENDED" });
    if (phase === "active" && requestedStart && !sameMinute(requestedStart, row.startsAt)) {
      throw new CampaignWriteError(invalid({ startsAt: ["startLocked"] }));
    }
    const window = { startsAt: phase === "active" ? row.startsAt : (requestedStart ?? row.startsAt), endsAt };
    const windowErrors = campaignWindowErrors(window, now);
    if (windowErrors) throw new CampaignWriteError(invalid(windowErrors));
    attempt.window = window;
    await assertNoOverlap(tx, window, id);
    await tx.update(campaigns).set({ name, ...window, updatedAt: sql`now()` }).where(eq(campaigns.id, id));
    return id;
  });
}

/** Delete Campaign (after the confirm dialog). Upcoming or active only; deleting an active one stops it early. */
export async function removeCampaign(id: number): Promise<CampaignActionResult> {
  await requireAdmin();
  const parsed = z.int().positive().safeParse(id);
  if (!parsed.success) return { ok: false, code: "NOT_FOUND" };

  return runCampaignWrite({}, async (tx) => {
    const row = await lockCampaignRow(tx, parsed.data);
    if (campaignPhase(row, new Date()) === "ended") throw new CampaignWriteError({ ok: false, code: "ENDED" });
    await tx.delete(campaigns).where(eq(campaigns.id, row.id));
    return row.id;
  });
}
