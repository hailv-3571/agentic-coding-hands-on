import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/shared/db/client";
import { userIcons } from "@/shared/db/schema";
import { SECRET_BOX_ICON_CODES, type IconCollectionSlot } from "../schemas/secret-box-views";

/**
 * IconCollectionQuery (A4, FR-207) for the own and other-profile collection (phase 12): always the 6
 * slots in SECRET_BOX_ICON_CODES order, `owned` + `quantity` (0 when missing). Icons are not private.
 */
async function forUser(userId: string): Promise<IconCollectionSlot[]> {
  const rows = await db.select({ iconCode: userIcons.iconCode, quantity: userIcons.quantity }).from(userIcons).where(eq(userIcons.userId, userId));
  const quantities = new Map(rows.map((row) => [row.iconCode, row.quantity]));
  return SECRET_BOX_ICON_CODES.map((iconCode) => {
    const quantity = quantities.get(iconCode) ?? 0;
    return { iconCode, owned: quantity > 0, quantity };
  });
}

export const IconCollectionQuery = { forUser } as const;
