import { describe, expect, it } from "vitest";
import { addAllRow } from "@/features/admin-overview/server/add-all-row";
import type { UnitStatsRow } from "@/features/admin-overview/schemas/unit-stats-views";

/**
 * F015 BR-006 / D011: the "All" row is the sum of the unit rows plus the unassigned row (computed from
 * the same result, so equality holds by construction), and units read natural A–Z in Vietnamese
 * (CEVC2 before CEVC10, D before Đ) with "Chưa gán đơn vị" (unitId null) always last.
 */
let seq = 0;
const row = (unitName: string, counts: number[], unitId: string | null = `unit-${(seq += 1)}`): UnitStatsRow => {
  const [totalMembers, kudosSent, kudosReceived, usersWithReceivedKudo, secretBoxesReceived] = counts;
  return { unitId, unitName, totalMembers, kudosSent, kudosReceived, usersWithReceivedKudo, secretBoxesReceived };
};

describe("addAllRow", () => {
  it("sums every column over the unit rows and the unassigned row", () => {
    const table = addAllRow([row("CEVC1", [10, 4, 6, 3, 2]), row("Chưa gán đơn vị", [2, 1, 3, 1, 5], null), row("OPD", [7, 0, 2, 2, 0])]);
    expect(table.all).toEqual({ totalMembers: 19, kudosSent: 5, kudosReceived: 11, usersWithReceivedKudo: 6, secretBoxesReceived: 7 });
  });

  it("orders units natural A–Z in Vietnamese, case-insensitive, and puts the unassigned row last", () => {
    const names = ["Đào tạo", "CEVC10", "Chưa gán đơn vị", "Dự án", "cevc3", "An ninh", "CEVC2"];
    const table = addAllRow(names.map((name) => row(name, [1, 0, 0, 0, 0], name === "Chưa gán đơn vị" ? null : undefined)));
    expect(table.rows.map((unit) => unit.unitName)).toEqual(["An ninh", "CEVC2", "cevc3", "CEVC10", "Dự án", "Đào tạo", "Chưa gán đơn vị"]);
  });

  it("keeps zero-activity units with zeros and gives all zeros for no rows", () => {
    const idle = row("Infra", [3, 0, 0, 0, 0]);
    expect(addAllRow([idle])).toEqual({ all: { totalMembers: 3, kudosSent: 0, kudosReceived: 0, usersWithReceivedKudo: 0, secretBoxesReceived: 0 }, rows: [idle] });
    expect(addAllRow([])).toEqual({ all: { totalMembers: 0, kudosSent: 0, kudosReceived: 0, usersWithReceivedKudo: 0, secretBoxesReceived: 0 }, rows: [] });
  });

  it("does not reorder the caller's array", () => {
    const input = [row("OPD", [1, 0, 0, 0, 0]), row("CEVC1", [1, 0, 0, 0, 0])];
    addAllRow(input);
    expect(input.map((unit) => unit.unitName)).toEqual(["OPD", "CEVC1"]);
  });
});
