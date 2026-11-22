import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AdminKudoSort } from "@/features/admin-moderation/schemas/admin-kudo-row";
import { KudoAdminQuery } from "@/features/admin-moderation/server/kudo-admin-query";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { addHearts, filterOf } from "./admin-moderation-fixtures";

/**
 * KudoAdminQuery paging and order (FR-202, FR-207, SC-005, D010): 10 per page, page clamped to the
 * last one, newest first by default, Heart sorts by raw count with an `id DESC` tiebreak so pages
 * never repeat or skip a row. `listForExport` sees the same set in the same order, capped at maxRows.
 */
let sender: Sunner, dave: Sunner, erin: Sunner, nobody: Sunner;
let fans: Sunner[];
const newestIds: string[] = [];
const hearted: { id: string; hearts: number }[] = [];
const HEARTS = [3, 1, 1, 0, 0, 0, 0, 0, 0, 0, 2, 1];

beforeAll(async () => {
  [sender, dave, erin, nobody, ...fans] = await Promise.all(
    ["pg-sender", "pg-dave", "pg-erin", "pg-nobody", "pg-fan1", "pg-fan2", "pg-fan3"].map((prefix) => createSunner(prefix, prefix)),
  );
  for (let second = 0; second < 23; second += 1) {
    const createdAt = new Date(Date.UTC(2102, 0, 1, 0, 0, second)).toISOString();
    newestIds.unshift(await insertKudo({ sender, recipient: dave, createdAt, status: second % 4 === 0 ? "spam" : "public" }));
  }
  for (const [index, hearts] of HEARTS.entries()) {
    const id = await insertKudo({ sender, recipient: erin, createdAt: new Date(Date.UTC(2102, 1, 1, 0, 0, index)).toISOString() });
    await addHearts(id, fans.slice(0, hearts));
    hearted.push({ id, hearts });
  }
});
afterAll(async () => {
  await cleanupSunners([sender, dave, erin, nobody, ...fans]);
  await closeAppDb();
});

const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);

describe("KudoAdminQuery.list — pagination", () => {
  it("returns 10 rows per page, newest first, with total and page count", async () => {
    const first = await KudoAdminQuery.list(filterOf({ receiverId: dave.id }), "vi");
    expect(first).toMatchObject({ total: 23, page: 1, pageCount: 3 });
    expect(first.rows.map((row) => row.id)).toEqual(newestIds.slice(0, 10));
    const pages = await Promise.all([2, 3].map((page) => KudoAdminQuery.list(filterOf({ receiverId: dave.id, page }), "vi")));
    expect([...first.rows, ...pages.flatMap((page) => page.rows)].map((row) => row.id)).toEqual(newestIds);
  });

  it("clamps a page beyond the last one to the last page", async () => {
    const page = await KudoAdminQuery.list(filterOf({ receiverId: dave.id, page: 99 }), "vi");
    expect(page).toMatchObject({ total: 23, page: 3, pageCount: 3 });
    expect(page.rows.map((row) => row.id)).toEqual(newestIds.slice(20));
  });

  it("answers an empty first page when nothing matches", async () => {
    expect(await KudoAdminQuery.list(filterOf({ receiverId: nobody.id, page: 5 }), "vi")).toEqual({ rows: [], total: 0, page: 1, pageCount: 1 });
  });
});

describe("KudoAdminQuery.list — Heart sort (raw count, id DESC tiebreak)", () => {
  it.each<[AdminKudoSort, 1 | -1]>([
    ["hearts_desc", -1],
    ["hearts_asc", 1],
  ])("%s is a total order that pages without repeats or gaps", async (sort, direction) => {
    const expected = [...hearted].sort((a, b) => (a.hearts - b.hearts) * direction || byId(a, b));
    const pages = await Promise.all([1, 2].map((page) => KudoAdminQuery.list(filterOf({ receiverId: erin.id, sort, page }), "vi")));
    const rows = pages.flatMap((page) => page.rows);
    expect(rows.map((row) => [row.id, row.heartCount])).toEqual(expected.map((row) => [row.id, row.hearts]));
  });
});

describe("KudoAdminQuery.listForExport", () => {
  it("lists the matching rows in table order from the first one, ignoring the page, up to maxRows", async () => {
    const filter = filterOf({ receiverId: dave.id, status: "public", page: 2 });
    const [all, capped, table] = await Promise.all([
      KudoAdminQuery.listForExport(filter, "vi", 100),
      KudoAdminQuery.listForExport(filter, "vi", 5),
      KudoAdminQuery.list(filter, "vi"),
    ]);
    expect(table.total).toBe(17);
    expect(all).toHaveLength(17);
    expect(all.map((row) => row.id)).toEqual(newestIds.filter((id) => all.some((row) => row.id === id)));
    expect(all.every((row) => row.status === "public")).toBe(true);
    expect(capped.map((row) => row.id)).toEqual(all.slice(0, 5).map((row) => row.id));
  });
});
