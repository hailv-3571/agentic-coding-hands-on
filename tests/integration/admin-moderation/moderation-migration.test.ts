import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testSql, withRollback } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";

/**
 * Migration 0013_kudos_moderation_columns (phase 08): nullable `moderated_by` (FK profiles,
 * ON DELETE SET NULL) and `moderated_at`, the pair CHECK, journal applied, and down → up inside a
 * transaction that is always rolled back (DDL is transactional in Postgres).
 */
const TAG = "0013_kudos_moderation_columns";
const CHECK_NAME = "kudos_moderated_by_needs_moderated_at";
const statementsOf = (file: string) =>
  readFileSync(`db/migrations/${file}`, "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.replace(/--.*$/gm, "").trim().length > 0);
type Tx = Parameters<Parameters<typeof withRollback>[0]>[0];
const moderationColumns = async (tx: Tx) =>
  (
    await tx.execute<{ name: string }>(sql`
      select column_name as name from information_schema.columns
      where table_schema = 'public' and table_name = 'kudos' and column_name like 'moderated_%' order by 1`)
  ).map((row) => row.name);
const insertKudo = (tx: Tx, sender: Sunner, recipient: Sunner) =>
  tx.execute<{ id: string }>(sql`
    insert into public.kudos (sender_id, recipient_id, body) values (${sender.id}, ${recipient.id}, 'x') returning id`);

let sender: Sunner;
let recipient: Sunner;
let moderator: Sunner;
beforeAll(async () => {
  [sender, recipient, moderator] = await Promise.all([
    createSunner("mig8-sender", "Mig8 Sender"),
    createSunner("mig8-recipient", "Mig8 Recipient"),
    createSunner("mig8-moderator", "Mig8 Moderator"),
  ]);
});
afterAll(async () => cleanupSunners([sender, recipient, moderator]));

describe("kudos moderation columns", () => {
  it("adds nullable moderated_by (uuid → profiles, ON DELETE SET NULL) and moderated_at (timestamptz)", async () => {
    const columns = await testSql<{ column_name: string; data_type: string; is_nullable: string }[]>`
      select column_name, data_type, is_nullable from information_schema.columns
      where table_schema = 'public' and table_name = 'kudos' and column_name like 'moderated_%' order by 1`;
    expect(columns).toEqual([
      { column_name: "moderated_at", data_type: "timestamp with time zone", is_nullable: "YES" },
      { column_name: "moderated_by", data_type: "uuid", is_nullable: "YES" },
    ]);
    const [fk] = await testSql<{ target: string; on_delete: string }[]>`
      select confrelid::regclass::text as target, confdeltype::text as on_delete from pg_constraint
      where conrelid = 'public.kudos'::regclass and contype = 'f'
        and conkey = array[(select attnum from pg_attribute where attrelid = 'public.kudos'::regclass and attname = 'moderated_by')]`;
    expect(fk).toEqual({ target: "profiles", on_delete: "n" });
  });

  it("leaves existing and new kudos unmoderated (both columns null)", async () => {
    const row = await withRollback(async (tx) => {
      const [kudo] = await insertKudo(tx, sender, recipient);
      const [read] = await tx.execute<{ moderated_by: string | null; moderated_at: string | null }>(sql`
        select moderated_by, moderated_at from public.kudos where id = ${kudo.id}`);
      return read;
    });
    expect(row).toEqual({ moderated_by: null, moderated_at: null });
  });

  it("rejects a moderator without a moderation time (CHECK)", async () => {
    const attempt = withRollback(async (tx) => {
      const [kudo] = await insertKudo(tx, sender, recipient);
      await tx.execute(sql`update public.kudos set moderated_by = ${moderator.id} where id = ${kudo.id}`);
    });
    await expect(attempt).rejects.toMatchObject({ cause: expect.objectContaining({ constraint_name: CHECK_NAME }) });
  });

  it("keeps moderated_at but clears moderated_by when the moderator's profile is deleted", async () => {
    const row = await withRollback(async (tx) => {
      const [kudo] = await insertKudo(tx, sender, recipient);
      await tx.execute(sql`
        update public.kudos set status = 'spam', moderated_by = ${moderator.id}, moderated_at = now() where id = ${kudo.id}`);
      await tx.execute(sql`delete from public.profiles where id = ${moderator.id}`);
      const [read] = await tx.execute<{ moderated_by: string | null; has_time: boolean; status: string }>(sql`
        select moderated_by, moderated_at is not null as has_time, status from public.kudos where id = ${kudo.id}`);
      return read;
    });
    expect(row).toEqual({ moderated_by: null, has_time: true, status: "spam" });
  });
});

describe("migration 0013", () => {
  it("is a journal entry that drizzle-kit migrate has applied", async () => {
    const journal = JSON.parse(readFileSync("db/migrations/meta/_journal.json", "utf8")) as {
      entries: { tag: string; when: number }[];
    };
    const when = journal.entries.find((entry) => entry.tag === TAG)?.when ?? -1;
    const [row] = await testSql<{ count: number }[]>`
      select count(*)::int as count from drizzle.__drizzle_migrations where created_at = ${when}`;
    expect(row.count).toBe(1);
  });

  it("rolls down and back up cleanly, keeping kudo_status and the rows", async () => {
    const result = await withRollback(async (tx) => {
      const [kudo] = await insertKudo(tx, sender, recipient);
      for (const statement of statementsOf(`${TAG}.down.sql`)) await tx.execute(sql.raw(statement));
      const afterDown = await moderationColumns(tx);
      for (const statement of statementsOf(`${TAG}.sql`)) await tx.execute(sql.raw(statement));
      const afterUp = await moderationColumns(tx);
      const [check] = await tx.execute<{ count: number }>(sql`
        select count(*)::int as count from pg_constraint where conname = ${CHECK_NAME} and contype = 'c'`);
      const [kept] = await tx.execute<{ status: string }>(sql`select status from public.kudos where id = ${kudo.id}`);
      return { afterDown, afterUp, check: check.count, status: kept.status };
    });
    expect(result).toEqual({ afterDown: [], afterUp: ["moderated_at", "moderated_by"], check: 1, status: "public" });
  });
});
