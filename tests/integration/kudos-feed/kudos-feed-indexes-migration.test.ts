import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { testSql } from "../../setup/integration-db";

/**
 * Migration NNNN_kudos_feed_indexes (phase 05): the feed order `(created_at DESC, id DESC)` is
 * index-backed for the three entry points of KudoPublicQuery — status (Live board), recipient
 * and sender (phase 12 profile). Plain `DESC` (NULLS FIRST) is what `ORDER BY … DESC` needs.
 */
const EXPECTED: Record<string, string> = {
  kudos_status_created_at_id_idx: "(status, created_at DESC, id DESC)",
  kudos_recipient_id_created_at_id_idx: "(recipient_id, created_at DESC, id DESC)",
  kudos_sender_id_created_at_id_idx: "(sender_id, created_at DESC, id DESC)",
};

describe("kudos feed indexes migration", () => {
  it("creates the three btree feed-order indexes on kudos", async () => {
    const rows = await testSql<{ indexname: string; indexdef: string }[]>`
      select indexname, indexdef from pg_indexes
      where schemaname = 'public' and tablename = 'kudos' and indexname = any(${Object.keys(EXPECTED)})`;
    const columnsByName = Object.fromEntries(
      rows.map((row) => [row.indexname, row.indexdef.slice(row.indexdef.indexOf("USING btree ") + 12)]),
    );
    expect(columnsByName).toEqual(EXPECTED);
  });

  it("is a journal entry that drizzle-kit migrate has applied", async () => {
    const journal = JSON.parse(readFileSync("db/migrations/meta/_journal.json", "utf8")) as {
      entries: { tag: string; when: number }[];
    };
    const entry = journal.entries.find((candidate) => candidate.tag.endsWith("_kudos_feed_indexes"));
    expect(entry).toBeDefined();
    // drizzle records each applied migration with created_at = the journal entry's `when`.
    const [row] = await testSql<{ count: number }[]>`
      select count(*)::int as count from drizzle.__drizzle_migrations where created_at = ${entry?.when ?? -1}`;
    expect(row.count).toBe(1);
  });
});
