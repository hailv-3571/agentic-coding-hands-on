import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, type DbTx } from "@/shared/db/client";
import { mysteryGiftAwards, secretBoxes, secretBoxPrizes, userIcons } from "@/shared/db/schema";
import type { OpenSecretBoxResult, SecretBoxIconCode } from "../schemas/secret-box-views";
import { IconCollectionService } from "./icon-collection-service";
import { PrizeDrawService } from "./prize-draw-service";
import { lockSecretBoxUser } from "./secret-box-advisory-lock";
import { SecretBoxQuery } from "./secret-box-query";

/**
 * SecretBoxOpenService (A2, ALG-002, FR-402, BR-003, D010). `userId` comes from the session only;
 * `requestId` is the client's Idempotency-Key. Reconcile first (its own transaction, best effort:
 * granted boxes stay openable when the heart totals cannot be read), then ONE transaction under the
 * user's advisory lock: a box already opened with this key → its stored result (`replayed: true`);
 * else the lowest unopened seq is opened with a server-side draw, the icon added (mystery gift on the
 * 6th) — all or nothing. No box left → NoBoxLeftError (409). Opening stays possible after
 * EVENT_END_AT (decision log). No LAUNCH_AT gate: no box can exist before launch (no heart can).
 */
export class NoBoxLeftError extends Error {
  constructor() {
    super("NO_BOX_LEFT");
    this.name = "NoBoxLeftError";
  }
}

type StoredOpen = Omit<OpenSecretBoxResult, "unopenedLeft" | "replayed">;

/**
 * The result recorded for this key, re-derived from rows written by that open (same now()): set
 * completion = an award with `completed_at = opened_at`; duplicate = the icon's `first_obtained_at`
 * is NOT this open's `opened_at` (an earlier open created it). `<>` rather than `<`: a transaction
 * that began first can still take the user lock second, so its now() may be the earlier one.
 */
async function storedResult(tx: DbTx, userId: string, requestId: string): Promise<StoredOpen | null> {
  const [row] = await tx
    .select({
      kind: secretBoxPrizes.kind,
      iconCode: secretBoxPrizes.iconCode,
      name: secretBoxPrizes.name,
      giftName: mysteryGiftAwards.giftName,
      duplicate: sql<boolean>`coalesce(${userIcons.firstObtainedAt} <> ${secretBoxes.openedAt}, false)`,
    })
    .from(secretBoxes)
    .innerJoin(secretBoxPrizes, eq(secretBoxPrizes.id, secretBoxes.prizeId))
    .leftJoin(mysteryGiftAwards, and(eq(mysteryGiftAwards.userId, secretBoxes.userId), eq(mysteryGiftAwards.completedAt, secretBoxes.openedAt)))
    .leftJoin(userIcons, and(eq(userIcons.userId, secretBoxes.userId), eq(userIcons.iconCode, secretBoxPrizes.iconCode)))
    .where(and(eq(secretBoxes.userId, userId), eq(secretBoxes.openRequestId, requestId)))
    .limit(1);
  if (!row) return null;
  const iconCode = row.iconCode as SecretBoxIconCode | null;
  return { kind: row.kind, iconCode, name: row.name, setCompleted: row.giftName !== null, giftName: row.giftName, duplicate: row.duplicate };
}

async function lowestUnopenedBoxId(tx: DbTx, userId: string): Promise<string | null> {
  const [box] = await tx
    .select({ id: secretBoxes.id })
    .from(secretBoxes)
    .where(and(eq(secretBoxes.userId, userId), eq(secretBoxes.status, "unopened")))
    .orderBy(asc(secretBoxes.seq))
    .limit(1)
    .for("update");
  return box?.id ?? null;
}

async function openLowestBox(tx: DbTx, userId: string, requestId: string): Promise<StoredOpen> {
  const boxId = await lowestUnopenedBoxId(tx, userId);
  if (!boxId) throw new NoBoxLeftError();
  const prize = await PrizeDrawService.draw(tx);
  const opened = await tx
    .update(secretBoxes)
    .set({ status: "opened", prizeId: prize.id, openRequestId: requestId, openedAt: sql`now()` })
    .where(and(eq(secretBoxes.id, boxId), eq(secretBoxes.status, "unopened")))
    .returning({ id: secretBoxes.id });
  if (opened.length === 0) throw new Error("secret box changed under the user lock");
  const icon = prize.kind === "icon" && prize.iconCode ? await IconCollectionService.addIcon(tx, userId, prize.iconCode) : null;
  return {
    kind: prize.kind,
    iconCode: prize.iconCode,
    name: prize.name,
    setCompleted: icon?.setCompleted ?? false,
    giftName: icon?.giftName ?? null,
    duplicate: icon?.duplicate ?? false,
  };
}

async function openNext(userId: string, requestId: string, now: Date = new Date()): Promise<OpenSecretBoxResult> {
  await SecretBoxQuery.tryReconcile(userId, now);
  return db.transaction(async (tx) => {
    await lockSecretBoxUser(tx, userId);
    const stored = await storedResult(tx, userId, requestId);
    const result = stored ?? (await openLowestBox(tx, userId, requestId));
    return { ...result, unopenedLeft: await SecretBoxQuery.countUnopened(userId, tx), replayed: stored !== null };
  });
}

export const SecretBoxOpenService = { openNext } as const;
