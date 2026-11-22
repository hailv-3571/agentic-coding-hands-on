import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { testSql, withRollback } from "../../setup/integration-db";

/**
 * Migration NNNN_kudos_hero_tier_index (phase 09): the partial index that makes the Hero tier
 * aggregate (COUNT DISTINCT sender_id per recipient over public kudos) an index-only read. Applied
 * through the drizzle journal; down → up runs inside a transaction that is always rolled back.
 */
const INDEX = "kudos_public_recipient_sender_idx";
const EXPECTED_DEF = `CREATE INDEX ${INDEX} ON public.kudos USING btree (recipient_id, sender_id) WHERE (status = 'public'::kudo_status)`;

type Journal = { entries: { tag: string; when: number }[] };
const journalEntry = () =>
  (JSON.parse(readFileSync("db/migrations/meta/_journal.json", "utf8")) as Journal).entries.find((entry) =>
    entry.tag.endsWith("_kudos_hero_tier_index"),
  );
const statementsOf = (file: string) =>
  readFileSync(`db/migrations/${file}`, "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.replace(/--.*$/gm, "").trim().length > 0);

describe("kudos Hero tier index migration", () => {
  it("creates the partial btree index (recipient_id, sender_id) over public kudos only", async () => {
    const rows = await testSql<{ indexdef: string }[]>`
      select indexdef from pg_indexes where schemaname = 'public' and tablename = 'kudos' and indexname = ${INDEX}`;
    expect(rows.map((row) => row.indexdef)).toEqual([EXPECTED_DEF]);
  });

  it("is a journal entry that drizzle-kit migrate has applied", async () => {
    const entry = journalEntry();
    expect(entry).toBeDefined();
    const [row] = await testSql<{ count: number }[]>`
      select count(*)::int as count from drizzle.__drizzle_migrations where created_at = ${entry?.when ?? -1}`;
    expect(row.count).toBe(1);
  });

  it("rolls down and back up cleanly (only the index changes)", async () => {
    const tag = journalEntry()?.tag ?? "missing";
    const indexCount = async (tx: Parameters<Parameters<typeof withRollback>[0]>[0]) => {
      const [row] = await tx.execute<{ count: number }>(sql`
        select count(*)::int as count from pg_indexes where schemaname = 'public' and indexname = ${INDEX}`);
      return row.count;
    };
    const result = await withRollback(async (tx) => {
      for (const statement of statementsOf(`${tag}.down.sql`)) await tx.execute(sql.raw(statement));
      const afterDown = await indexCount(tx);
      for (const statement of statementsOf(`${tag}.sql`)) await tx.execute(sql.raw(statement));
      return { afterDown, afterUp: await indexCount(tx) };
    });
    expect(result).toEqual({ afterDown: 0, afterUp: 1 });
  });
});
