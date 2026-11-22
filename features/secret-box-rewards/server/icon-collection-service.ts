import "server-only";
import { count, eq, sql } from "drizzle-orm";
import type { DbTx } from "@/shared/db/client";
import { mysteryGiftAwards, userIcons } from "@/shared/db/schema";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";
import { SECRET_BOX_ICON_CODES, type SecretBoxIconCode } from "../schemas/secret-box-views";
import { MYSTERY_GIFT_NAME } from "../secret-box-config";

/**
 * IconCollectionService (FR-304, FR-404, FR-408, BR-005, C-03), inside the caller's open transaction
 * (which holds the user's advisory lock). Adds the icon (a duplicate only increments `quantity` and
 * is reported as `duplicate`); when the user now owns all 6 codes, `INSERT mystery_gift_awards … ON
 * CONFLICT (user_id) DO NOTHING` and ONLY when that row is new, the `SetCompleted{userId, giftName}`
 * event — once per user, ever. `completed_at` and a new icon's `first_obtained_at` default to now() =
 * the box's `opened_at` (same transaction): the replay reads both back.
 */
export type IconAddOutcome = { setCompleted: boolean; giftName: string | null; duplicate: boolean };

async function addIcon(tx: DbTx, userId: string, iconCode: SecretBoxIconCode): Promise<IconAddOutcome> {
  const [icon] = await tx
    .insert(userIcons)
    .values({ userId, iconCode, quantity: 1 })
    .onConflictDoUpdate({ target: [userIcons.userId, userIcons.iconCode], set: { quantity: sql`${userIcons.quantity} + 1` } })
    .returning({ quantity: userIcons.quantity });
  const duplicate = (icon?.quantity ?? 1) > 1;
  const [owned] = await tx.select({ distinctIcons: count() }).from(userIcons).where(eq(userIcons.userId, userId));
  if ((owned?.distinctIcons ?? 0) < SECRET_BOX_ICON_CODES.length) return { setCompleted: false, giftName: null, duplicate };

  const awarded = await tx
    .insert(mysteryGiftAwards)
    .values({ userId, giftName: MYSTERY_GIFT_NAME })
    .onConflictDoNothing({ target: mysteryGiftAwards.userId })
    .returning({ giftName: mysteryGiftAwards.giftName });
  if (awarded.length === 0) return { setCompleted: false, giftName: null, duplicate };
  await DomainEventOutbox.add(tx, "SetCompleted", { userId, giftName: MYSTERY_GIFT_NAME });
  return { setCompleted: true, giftName: MYSTERY_GIFT_NAME, duplicate };
}

export const IconCollectionService = { addIcon } as const;
