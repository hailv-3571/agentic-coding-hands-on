import { describe, expect, it, vi } from "vitest";
import type { UnitStatsTable } from "@/features/admin-overview/schemas/unit-stats-views";

vi.mock("@/shared/config/env", () => ({ env: { ADMIN_TIMEZONE: "Asia/Ho_Chi_Minh" } }));

const { OVERVIEW_CSV_HEADER, serializeOverviewCsv } = await import("@/features/admin-overview/server/overview-export-columns");

/**
 * Admin › Overview CSV (F015 A2, FR-402/602): the table's seven columns, the "All" row first, then the
 * units numbered 1..n in table order (unassigned last), through the phase 01 serializer (BOM, formula
 * guard on unit names).
 */
const table: UnitStatsTable = {
  all: { totalMembers: 12, kudosSent: 9, kudosReceived: 9, usersWithReceivedKudo: 5, secretBoxesReceived: 4 },
  rows: [
    { unitId: "a", unitName: "CEVC1", totalMembers: 7, kudosSent: 6, kudosReceived: 3, usersWithReceivedKudo: 2, secretBoxesReceived: 1 },
    { unitId: "b", unitName: "=SUM(A1:A9)", totalMembers: 3, kudosSent: 3, kudosReceived: 5, usersWithReceivedKudo: 2, secretBoxesReceived: 3 },
    { unitId: null, unitName: "Chưa gán đơn vị", totalMembers: 2, kudosSent: 0, kudosReceived: 1, usersWithReceivedKudo: 1, secretBoxesReceived: 0 },
  ],
};

describe("serializeOverviewCsv", () => {
  it("has the table's seven columns", () => {
    expect(OVERVIEW_CSV_HEADER).toEqual([
      "No",
      "Unit",
      "Total member",
      "Total sent kudos",
      "Total received kudos",
      "Total users with at least 1 kudo",
      "Total received secret box",
    ]);
  });

  it("writes the All row first, then the numbered units in order, with a BOM and formula-safe names", () => {
    const csv = serializeOverviewCsv(table);
    expect(csv.startsWith("﻿No,Unit,")).toBe(true);
    expect(csv.split("\r\n").slice(1, -1)).toEqual([",All,12,9,9,5,4", "1,CEVC1,7,6,3,2,1", "2,'=SUM(A1:A9),3,3,5,2,3", "3,Chưa gán đơn vị,2,0,1,1,0"]);
  });
});
