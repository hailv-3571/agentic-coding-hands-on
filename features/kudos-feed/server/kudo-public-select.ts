import "server-only";
import { eq, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/shared/db/client";
import { departments, kudos, profiles } from "@/shared/db/schema";

/**
 * The shared read shape of KudoPublicQuery: one Kudo row with its sender, recipient and their
 * departments. RAW: it holds the real sender even for an anonymous Kudo, so it must only ever
 * reach `maskKudoRow` (kudo-row-mask.ts), never a response, log or client component. No email
 * column is selected at all: no card shows one.
 */
const sender = alias(profiles, "sender");
const recipient = alias(profiles, "recipient");
const senderDepartment = alias(departments, "sender_department");
const recipientDepartment = alias(departments, "recipient_department");

/** `created_at` at full microsecond precision in UTC: the cursor key (a JS Date keeps ms only). */
const cursorAt = sql<string>`to_char(${kudos.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

const kudoPublicColumns = {
  id: kudos.id,
  title: kudos.title,
  body: kudos.body,
  isAnonymous: kudos.isAnonymous,
  anonymousNickname: kudos.anonymousNickname,
  status: kudos.status,
  createdAt: kudos.createdAt,
  cursorAt,
  senderId: kudos.senderId,
  senderName: sender.fullName,
  senderAvatarUrl: sender.avatarUrl,
  senderDepartmentId: senderDepartment.id,
  senderDepartmentCode: senderDepartment.code,
  recipientId: kudos.recipientId,
  recipientName: recipient.fullName,
  recipientAvatarUrl: recipient.avatarUrl,
  recipientDepartmentId: recipientDepartment.id,
  recipientDepartmentCode: recipientDepartment.code,
};

/** Rows matching `where` (callers add ORDER BY / LIMIT); one statement, joins only. */
export function selectKudoPublicRows(where: SQL | undefined) {
  return db
    .select(kudoPublicColumns)
    .from(kudos)
    .innerJoin(sender, eq(sender.id, kudos.senderId))
    .leftJoin(senderDepartment, eq(senderDepartment.id, sender.departmentId))
    .innerJoin(recipient, eq(recipient.id, kudos.recipientId))
    .leftJoin(recipientDepartment, eq(recipientDepartment.id, recipient.departmentId))
    .where(where);
}

export type KudoPublicRow = Awaited<ReturnType<typeof selectKudoPublicRows>>[number];
