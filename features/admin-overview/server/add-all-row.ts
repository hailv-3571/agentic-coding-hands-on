import type { UnitStatsRow, UnitStatsTable } from "../schemas/unit-stats-views";

/**
 * F015 BR-006 / D011 (pure): the "All" row = Σ of every grouped row, the unassigned row included —
 * summed from the same result instead of a second query, so All always equals units + unassigned
 * (each profile has at most one department, so even the distinct-recipient column adds up). Units
 * are ordered natural A–Z in Vietnamese (CEVC2 before CEVC10, D before Đ), unassigned (null) last.
 */
const unitNameOrder = new Intl.Collator("vi", { numeric: true });

const METRICS = ["totalMembers", "kudosSent", "kudosReceived", "usersWithReceivedKudo", "secretBoxesReceived"] as const;

function compareUnits(a: UnitStatsRow, b: UnitStatsRow): number {
  if ((a.unitId === null) !== (b.unitId === null)) return a.unitId === null ? 1 : -1;
  return unitNameOrder.compare(a.unitName, b.unitName);
}

export function addAllRow(rows: readonly UnitStatsRow[]): UnitStatsTable {
  const all: UnitStatsTable["all"] = {
    totalMembers: 0,
    kudosSent: 0,
    kudosReceived: 0,
    usersWithReceivedKudo: 0,
    secretBoxesReceived: 0,
  };
  for (const row of rows) for (const metric of METRICS) all[metric] += row[metric];
  return { all, rows: [...rows].sort(compareUnits) };
}
