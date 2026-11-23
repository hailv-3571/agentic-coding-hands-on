import "server-only";
import { and, count, countDistinct, eq, gte, lt, sql, type SQL, type SQLWrapper } from "drizzle-orm";
import { alias, type PgColumn } from "drizzle-orm/pg-core";
import type { AdminDateRange } from "@/shared/admin/date-range-filter";
import { db } from "@/shared/db/client";
import { departments, kudos, profiles, secretBoxes } from "@/shared/db/schema";
import type { Locale } from "@/shared/i18n/locales";
import type { UnitStatsRow, UnitStatsTable } from "../schemas/unit-stats-views";
import { addAllRow } from "./add-all-row";

/**
 * UnitStatsQuery (F015 A1/A2, ALG-001): the five per-unit numbers in ONE statement — one grouped
 * subquery per metric, keyed by the attributed profile's `department_id` (NULL = unassigned), never a
 * kudos × boxes cross join. `departments FULL JOIN members` yields every department (zero-activity ones
 * included, FR-205) plus the unassigned row exactly when unassigned profiles exist (DEC-001); the other
 * metrics join on `IS NOT DISTINCT FROM` so the NULL key matches too. Rules: public kudos only, counted
 * at query time (BR-001); sent → sender's unit, received and distinct recipients → recipient's unit,
 * anonymous kudos included (BR-002/003); boxes by `granted_at`, any status (BR-005); members ignore the
 * range (BR-004). The "All" row is added in TS from the same rows (`addAllRow`, BR-006). Admin-only.
 */
const UNASSIGNED_UNIT_NAME: Record<Locale, string> = { vi: "Chưa gán đơn vị", en: "Unassigned" };

const sender = alias(profiles, "sender");
const recipient = alias(profiles, "recipient");
const owner = alias(profiles, "owner");

function inRange(column: PgColumn, { start, end }: AdminDateRange): SQL | undefined {
  return and(start ? gte(column, start) : undefined, end ? lt(column, end) : undefined);
}

function unitMetricSubqueries(range: AdminDateRange) {
  const publicInRange = and(eq(kudos.status, "public"), inRange(kudos.createdAt, range));
  const members = db
    .select({ unitId: profiles.departmentId, n: count().as("member_count") })
    .from(profiles)
    .groupBy(profiles.departmentId)
    .as("unit_members");
  const sent = db
    .select({ unitId: sender.departmentId, n: count().as("sent_count") })
    .from(kudos)
    .innerJoin(sender, eq(sender.id, kudos.senderId))
    .where(publicInRange)
    .groupBy(sender.departmentId)
    .as("unit_sent");
  const received = db
    .select({ unitId: recipient.departmentId, n: count().as("received_count"), users: countDistinct(kudos.recipientId).as("recipient_count") })
    .from(kudos)
    .innerJoin(recipient, eq(recipient.id, kudos.recipientId))
    .where(publicInRange)
    .groupBy(recipient.departmentId)
    .as("unit_received");
  const boxes = db
    .select({ unitId: owner.departmentId, n: count().as("box_count") })
    .from(secretBoxes)
    .innerJoin(owner, eq(owner.id, secretBoxes.userId))
    .where(inRange(secretBoxes.grantedAt, range))
    .groupBy(owner.departmentId)
    .as("unit_boxes");
  return { members, sent, received, boxes };
}

const zeroIfNone = (value: SQLWrapper) => sql<number>`coalesce(${value}, 0)`.mapWith(Number);
const sameUnit = (unitId: SQLWrapper) => sql`${unitId} is not distinct from ${departments.id}`;

async function unitRows(range: AdminDateRange, locale: Locale): Promise<UnitStatsRow[]> {
  const { members, sent, received, boxes } = unitMetricSubqueries(range);
  const rows = await db
    .select({
      unitId: departments.id,
      nameVi: departments.nameVi,
      nameEn: departments.nameEn,
      totalMembers: zeroIfNone(members.n),
      kudosSent: zeroIfNone(sent.n),
      kudosReceived: zeroIfNone(received.n),
      usersWithReceivedKudo: zeroIfNone(received.users),
      secretBoxesReceived: zeroIfNone(boxes.n),
    })
    .from(departments)
    .fullJoin(members, eq(members.unitId, departments.id))
    .leftJoin(sent, sameUnit(sent.unitId))
    .leftJoin(received, sameUnit(received.unitId))
    .leftJoin(boxes, sameUnit(boxes.unitId));
  return rows.map(({ unitId, nameVi, nameEn, ...metrics }) => ({
    unitId,
    unitName: unitId === null ? UNASSIGNED_UNIT_NAME[locale] : ((locale === "en" ? nameEn : nameVi) ?? ""),
    ...metrics,
  }));
}

/** The Overview table for a range (all time when both ends are absent): "All" + units in order. */
async function forRange(range: AdminDateRange, locale: Locale): Promise<UnitStatsTable> {
  return addAllRow(await unitRows(range, locale));
}

export const UnitStatsQuery = { forRange } as const;
