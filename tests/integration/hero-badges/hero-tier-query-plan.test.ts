import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { HeroTierQuery } from "@/features/hero-badges/server/hero-tier-query";
import { db } from "@/shared/db/client";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";

/**
 * F009 NFR "one query per page, index-only at 10k kudos": EXPLAIN ANALYZE of the EXACT statement
 * HeroTierQuery sends (captured from the app pool) for a page of 50 recipients over 10k kudos
 * (2,000 recipients, 10 % spam). The data lives in a session-local TEMP table named `kudos`, which
 * Postgres resolves before `public.kudos` for the unqualified statement; it is a `LIKE public.kudos
 * INCLUDING ALL` copy, so it carries the same partial index definition (migration 0014). Unlike a
 * transaction, the session can VACUUM, so pages are all-visible as autovacuum leaves them in
 * production. The real table is never touched; the temp table is dropped at the end.
 */
const RECIPIENTS = 2_000;
const KUDOS = 10_000;
const PAGE = 50;
const PARTIAL_INDEX_DEF = /USING btree \(recipient_id, sender_id\) WHERE \(status = 'public'::kudo_status\)$/;

afterAll(async () => closeAppDb());

/** The statement and parameters HeroTierQuery issues for `ids` (run once against the real pool). */
async function capturedStatement(ids: string[]): Promise<{ query: string; params: unknown[] }> {
  const client = (db as unknown as { $client: { unsafe: (query: string, params?: unknown[]) => unknown } }).$client;
  const spy = vi.spyOn(client, "unsafe");
  try {
    await HeroTierQuery.getDistinctSenderCounts(ids);
    expect(spy).toHaveBeenCalledTimes(1);
    const [query, params] = spy.mock.calls[0];
    return { query, params: params ?? [] };
  } finally {
    spy.mockRestore();
  }
}

type PlanNode = { "Node Type": string; "Index Name"?: string; "Heap Fetches"?: number; Plans?: PlanNode[] };
type ExplainRow = { "QUERY PLAN": [{ Plan: PlanNode; "Execution Time": number }] };
const flatten = (node: PlanNode): PlanNode[] => [node, ...(node.Plans ?? []).flatMap(flatten)];

describe("HeroTierQuery plan at 10k kudos", () => {
  it("reads a page of 50 recipients with an index-only scan of the partial index", async () => {
    const recipients = Array.from({ length: RECIPIENTS }, () => randomUUID());
    const { query, params } = await capturedStatement(recipients.slice(0, PAGE));
    expect(query).toMatch(/from "kudos"/);

    const session = await testSql.reserve();
    try {
      await session`create temp table kudos (like public.kudos including all)`;
      await session`
        insert into kudos (sender_id, recipient_id, body, status)
        select senders.ids[1 + (g * 7919) % 500], (${recipients}::uuid[])[1 + g % ${RECIPIENTS}::int], 'x',
               (case when g % 10 = 0 then 'spam' else 'public' end)::kudo_status
        from generate_series(1, ${KUDOS}) g,
             (select array_agg(gen_random_uuid()) as ids from generate_series(1, 500)) senders`;
      await session`vacuum analyze kudos`;
      const [row] = await session.unsafe<ExplainRow[]>(`explain (analyze, format json) ${query}`, params as never[]);
      const [{ Plan, "Execution Time": executionMs }] = row["QUERY PLAN"];
      const nodes = flatten(Plan);
      const plan = JSON.stringify(nodes.map((node) => [node["Node Type"], node["Index Name"]]));
      const scans = nodes.filter((node) => node["Node Type"].includes("Scan"));

      expect(scans.map((node) => node["Node Type"]), plan).toEqual(["Index Only Scan"]);
      expect(scans[0]["Heap Fetches"], plan).toBe(0);
      const [index] = await session<{ indexdef: string }[]>`
        select indexdef from pg_indexes where schemaname = pg_my_temp_schema()::regnamespace::text and indexname = ${scans[0]["Index Name"] ?? ""}`;
      expect(index?.indexdef, plan).toMatch(PARTIAL_INDEX_DEF);
      console.info(`[hero-tier plan] ${nodes.map((node) => node["Node Type"]).join(" > ")} (${scans[0]["Index Name"]}), ${executionMs} ms`);
    } finally {
      await session`drop table if exists pg_temp.kudos`;
      session.release();
    }
  });
});
