import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { parseOverviewParams } from "@/features/admin-overview/schemas/overview-params-schema";
import type { UnitStatsRow, UnitStatsTable } from "@/features/admin-overview/schemas/unit-stats-views";
import { UnitStatsQuery } from "@/features/admin-overview/server/unit-stats-query";
import { testSql } from "../../setup/integration-db";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import * as fx from "../admin-users/admin-users-fixtures";

/**
 * UnitStatsQuery (F015 A1, ALG-001, BR-001..006, DEC-001/002): sent → sender's unit, received and
 * "users with ≥1 received" (distinct) → recipient's unit, secret boxes → owner's unit by granted_at;
 * public kudos only (Un Spam restores); anonymous kudos count for the sender's unit; Total member
 * ignores the range; Vietnamese day boundaries (23:59:59 on `to` in, 00:00 next day out); zero-activity
 * units show 0; "Chưa gán đơn vị" exactly when unassigned profiles exist; All = Σ rows. Throw-away
 * departments isolate the per-unit numbers from the rest of the shared database.
 */
const T = fx.uniqueToken("Ov");
const vn = (wallClock: string) => new Date(`${wallClock}+07:00`).toISOString();
let a1: Sunner, a2: Sunner, b1: Sunner, u1: Sunner;
let unit2: string, unit10: string, unitIdle: string, spamKudo: string;

beforeAll(async () => {
  [a1, a2, b1] = await Promise.all([createSunner("ov-a1", "Ov A1"), createSunner("ov-a2", "Ov A2"), createSunner("ov-b1", "Ov B1")]);
  u1 = await fx.createUnassignedSunner("ov-u1", "Ov U1");
  [unit2, unit10, unitIdle] = await Promise.all(
    [`P14 ${T} 2`, `P14 ${T} 10`, `P14 ${T} Trống`].map((name) => fx.createTestDepartment(name)),
  );
  await fx.moveToTestDepartment([a1, a2], unit2);
  await fx.moveToTestDepartment([b1], unit10);
  await insertKudo({ sender: a1, recipient: b1, createdAt: vn("2025-12-05T23:59:59") });
  await insertKudo({ sender: a1, recipient: b1, createdAt: vn("2025-12-06T00:00:00") });
  await insertKudo({ sender: b1, recipient: a2, createdAt: vn("2025-12-01T00:00:00") });
  await insertKudo({ sender: b1, recipient: a2, createdAt: vn("2025-11-30T23:59:59") });
  await insertKudo({ sender: a2, recipient: a1, createdAt: vn("2025-12-03T10:00:00") });
  await insertKudo({ sender: a1, recipient: u1, createdAt: vn("2025-12-03T11:00:00") });
  spamKudo = await insertKudo({ sender: a2, recipient: b1, status: "spam", createdAt: vn("2025-12-03T12:00:00") });
  await insertKudo({ sender: b1, recipient: a1, nickname: "Gió", createdAt: vn("2025-12-02T09:00:00") });
  await fx.insertSecretBox(a1.id, 1, vn("2025-12-02T08:00:00"));
  await fx.insertSecretBox(a1.id, 2, vn("2025-12-07T08:00:00"));
  await fx.insertSecretBox(u1.id, 1, vn("2025-12-04T08:00:00"));
});
afterAll(async () => {
  await cleanupSunners([a1, a2, b1, u1]);
  await fx.deleteTestDepartments([unit2, unit10, unitIdle]);
  await closeAppDb();
});

async function tableFor(params: Record<string, string>): Promise<UnitStatsTable> {
  const parsed = parseOverviewParams(params);
  if (!parsed.ok) throw new Error(parsed.error);
  return UnitStatsQuery.forRange(parsed.range, "vi");
}
const counts = (row: UnitStatsRow | undefined) =>
  row && [row.totalMembers, row.kudosSent, row.kudosReceived, row.usersWithReceivedKudo, row.secretBoxesReceived];
const unitRow = (table: UnitStatsTable, unitId: string | null) => table.rows.find((row) => row.unitId === unitId);

describe("UnitStatsQuery.forRange", () => {
  it("attributes a Vietnamese-day range per unit: sender, recipient (distinct users), box owner", async () => {
    const table = await tableFor({ from: "2025-12-01", to: "2025-12-05" });
    expect(counts(unitRow(table, unit2))).toEqual([2, 3, 3, 2, 1]);
    expect(counts(unitRow(table, unit10))).toEqual([1, 2, 1, 1, 0]);
    expect(counts(unitRow(table, unitIdle))).toEqual([0, 0, 0, 0, 0]);
    expect(unitRow(table, unit2)?.unitName).toBe(`P14 ${T} 2`);
  });

  it("counts all time without a range, and open ranges from one end", async () => {
    expect(counts(unitRow(await tableFor({}), unit2))).toEqual([2, 4, 4, 2, 2]);
    expect(counts(unitRow(await tableFor({}), unit10))).toEqual([1, 3, 2, 1, 0]);
    expect(counts(unitRow(await tableFor({ from: "2025-12-06" }), unit10))).toEqual([1, 0, 1, 1, 0]);
    expect(counts(unitRow(await tableFor({ to: "2025-11-30" }), unit2))).toEqual([2, 0, 1, 1, 0]);
  });

  it("counts a spam kudo again once it is un-spammed", async () => {
    try {
      await testSql`update public.kudos set status = 'public' where id = ${spamKudo}`;
      expect(counts(unitRow(await tableFor({ from: "2025-12-01", to: "2025-12-05" }), unit10))).toEqual([1, 2, 2, 1, 0]);
    } finally {
      await testSql`update public.kudos set status = 'spam' where id = ${spamKudo}`;
    }
  });

  it("shows the unassigned row last, exactly when unassigned profiles exist, and All = Σ rows", async () => {
    const table = await tableFor({ from: "2025-12-01", to: "2025-12-05" });
    const [{ unassigned }] = await testSql<{ unassigned: number }[]>`
      select count(*)::int as unassigned from public.profiles where department_id is null`;
    expect(unassigned).toBeGreaterThan(0);
    const last = table.rows.at(-1);
    expect(last).toMatchObject({ unitId: null, unitName: "Chưa gán đơn vị", totalMembers: unassigned });
    expect(last?.kudosReceived).toBeGreaterThanOrEqual(1);
    expect(last?.secretBoxesReceived).toBeGreaterThanOrEqual(1);
    for (const metric of ["totalMembers", "kudosSent", "kudosReceived", "usersWithReceivedKudo", "secretBoxesReceived"] as const) {
      expect(table.all[metric]).toBe(table.rows.reduce((sum, row) => sum + row[metric], 0));
    }
    await fx.moveToTestDepartment([u1], unit10);
    try {
      const stillUnassigned = unassigned - 1;
      const after = await tableFor({});
      expect(after.rows.some((row) => row.unitId === null)).toBe(stillUnassigned > 0);
    } finally {
      await fx.moveToTestDepartment([u1], null);
    }
  });

  it("orders units natural A–Z (2 before 10) and reproduces the same numbers on a reload", async () => {
    const first = await tableFor({ from: "2025-12-01", to: "2025-12-05" });
    const mine = first.rows.filter((row) => row.unitName.includes(T)).map((row) => row.unitName);
    expect(mine).toEqual([`P14 ${T} 2`, `P14 ${T} 10`, `P14 ${T} Trống`]);
    expect(await tableFor({ from: "2025-12-01", to: "2025-12-05" })).toEqual(first);
  });
});
