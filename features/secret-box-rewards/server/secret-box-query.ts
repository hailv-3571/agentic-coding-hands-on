import "server-only";
import { and, count, eq, sql } from "drizzle-orm";
import { db, type Db, type DbTx } from "@/shared/db/client";
import { secretBoxes } from "@/shared/db/schema";
import type { SecretBoxScreenState } from "../schemas/secret-box-views";
import { SecretBoxGrantService } from "./secret-box-grant-service";

/**
 * SecretBoxQuery (A3, FR-301, FR-303): a user's box counts. `openScreenState` reconciles first
 * (FR-401: a box earned since the last visit is openable now); a failed reconcile is logged and the
 * boxes already granted are still counted, so the modal never depends on the heart totals.
 */
async function countUnopened(userId: string, executor: Db | DbTx = db): Promise<number> {
  const [row] = await executor
    .select({ unopened: count() })
    .from(secretBoxes)
    .where(and(eq(secretBoxes.userId, userId), eq(secretBoxes.status, "unopened")));
  return row?.unopened ?? 0;
}

/** `{opened, unopened}` in one query (panel rows "Secret Box đã mở / chưa mở"). */
async function boxCounts(userId: string): Promise<{ opened: number; unopened: number }> {
  const [row] = await db
    .select({
      opened: sql<number>`count(*) filter (where ${secretBoxes.status} = 'opened')::int`,
      unopened: sql<number>`count(*) filter (where ${secretBoxes.status} = 'unopened')::int`,
    })
    .from(secretBoxes)
    .where(eq(secretBoxes.userId, userId));
  return { opened: row?.opened ?? 0, unopened: row?.unopened ?? 0 };
}

/** Best-effort reconcile; returns false when it failed (already logged). */
async function tryReconcile(userId: string, now: Date): Promise<boolean> {
  try {
    await SecretBoxGrantService.reconcileForSender(userId, now);
    return true;
  } catch (error) {
    console.error("[secret-box] reconcile before reading boxes failed", error);
    return false;
  }
}

async function openScreenState(userId: string, now: Date = new Date()): Promise<SecretBoxScreenState> {
  await tryReconcile(userId, now);
  return { unopened: await countUnopened(userId) };
}

export const SecretBoxQuery = { countUnopened, boxCounts, openScreenState, tryReconcile } as const;
