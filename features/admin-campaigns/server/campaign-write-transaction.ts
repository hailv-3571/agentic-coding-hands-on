import "server-only";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, type DbTx } from "@/shared/db/client";
import { campaigns } from "@/shared/db/schema";
import { ADMIN_ROUTES } from "@/shared/ui/app-routes";
import type { CampaignActionFailure, CampaignActionResult } from "../schemas/campaign-admin-result";
import { CampaignOverlapCheck, type CampaignWindow } from "./campaign-overlap-check";

/**
 * Transaction runner shared by the three campaign actions (F011 A2–A4): runs the write, turns
 * expected rejections into in-band results, maps the EXCLUDE violation (SQLSTATE 23P01, two admins
 * saving at once) to the same OVERLAP answer as the pre-check, and refreshes Admin › Settings.
 */

/** Expected rejection raised inside the write transaction; throwing it rolls the transaction back. */
export class CampaignWriteError extends Error {
  constructor(readonly failure: CampaignActionFailure) {
    super(failure.code);
    this.name = "CampaignWriteError";
  }
}

/** Re-reads the row in the write transaction, locked against a concurrent edit/delete (BR-004). */
export async function lockCampaignRow(tx: DbTx, id: number): Promise<CampaignWindow & { id: number }> {
  const [row] = await tx
    .select({ id: campaigns.id, startsAt: campaigns.startsAt, endsAt: campaigns.endsAt })
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .for("update");
  if (!row) throw new CampaignWriteError({ ok: false, code: "NOT_FOUND" });
  return row;
}

/** The window being written (set by the write before it saves), used to name the winner of a race. */
export type CampaignWriteAttempt = { window?: CampaignWindow; excludeId?: number };

async function settle(attempt: CampaignWriteAttempt, write: (tx: DbTx) => Promise<number>): Promise<CampaignActionResult> {
  try {
    return { ok: true, id: await db.transaction(write) };
  } catch (error) {
    if (error instanceof CampaignWriteError) return error.failure;
    if (CampaignOverlapCheck.isOverlapViolation(error)) {
      const window = attempt.window;
      const conflict = window ? await CampaignOverlapCheck.find(db, window, attempt.excludeId).catch(() => null) : null;
      return conflict ? { ok: false, code: "OVERLAP", conflict } : { ok: false, code: "OVERLAP" };
    }
    console.error("[campaigns] write failed", error);
    return { ok: false, code: "UNEXPECTED" };
  }
}

export async function runCampaignWrite(
  attempt: CampaignWriteAttempt,
  write: (tx: DbTx) => Promise<number>,
): Promise<CampaignActionResult> {
  const result = await settle(attempt, write);
  // Saved, gone, ended or overlapping: the table on screen is stale — refresh it in the same round trip.
  if (result.ok || (result.code !== "VALIDATION" && result.code !== "UNEXPECTED")) revalidatePath(ADMIN_ROUTES.settings);
  return result;
}
