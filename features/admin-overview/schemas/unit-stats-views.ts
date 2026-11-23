/**
 * Phase 14 (F015) Admin › Overview view contracts shared by UnitStatsQuery, the export route and the
 * UI. Written by the orchestrator so backend and UI could be built in parallel. ADMIN-ONLY.
 * Client-safe: types only.
 *
 * Attribution: sent → sender's unit; received and "users with ≥1 received" → recipient's unit;
 * secret boxes → owner's unit by `granted_at`. Public kudos only. Total member ignores the date range
 * (D004). The "All" row = Σ unit rows + unassigned row, computed in TS from the same result (BR-006).
 */

export type UnitStatsRow = {
  /** Department id (uuid, phase 01 schema); null = "Chưa gán đơn vị" (only when such profiles exist). */
  unitId: string | null;
  unitName: string;
  totalMembers: number;
  kudosSent: number;
  kudosReceived: number;
  usersWithReceivedKudo: number;
  secretBoxesReceived: number;
};

export type UnitStatsTable = {
  /** Totals row shown first ("All"). */
  all: Omit<UnitStatsRow, "unitId" | "unitName">;
  /** Units natural A–Z (`Intl.Collator('vi', { numeric: true })`), unassigned last. */
  rows: UnitStatsRow[];
};

/** URL params (`yyyy-MM-dd` in ADMIN_TIMEZONE, half-open [from 00:00, to+1 00:00)); empty = all time. */
export type OverviewFilterValues = { from: string | null; to: string | null };

/** Props of `AdminOverviewScreen` (features/admin-overview/components/admin-overview-screen.tsx). */
export type AdminOverviewScreenProps = {
  data: UnitStatsTable | null;
  filter: OverviewFilterValues;
  /** from > to or malformed: show the message, `data` holds the all-time table (FR-403). */
  filterError: "invalid_date_range" | "invalid_params" | null;
  loadError: boolean;
};
