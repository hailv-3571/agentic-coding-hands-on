import { describe, expect, it, vi } from "vitest";
import type { AdminUserRow } from "@/features/admin-users/schemas/admin-user-views";

vi.mock("@/shared/config/env", () => ({ env: { ADMIN_TIMEZONE: "Asia/Ho_Chi_Minh" } }));

const { USER_CSV_HEADER, serializeAdminUserCsv, toAdminUserCsvRow } = await import(
  "@/features/admin-users/server/user-export-columns"
);

/**
 * Admin › User CSV (A4, D012, FR-603): the table's columns minus Actions, through the phase 01
 * serializer (BOM, RFC 4180, formula guard); instants as `dd/MM/yyyy HH:mm` in ADMIN_TIMEZONE like the
 * table; "—" cells are empty; the full uuid is exported (the table shows 8 characters).
 */
const row = (patch: Partial<AdminUserRow> = {}): AdminUserRow => ({
  id: "0b5d7a3e-8f1c-4c2a-9d4e-1f2a3b4c5d6e",
  shortId: "0b5d7a3e",
  name: "Nguyễn Văn A",
  email: "a@sun-asterisk.com",
  kudosSent: 3,
  kudosReceived: 7,
  totalHearts: 12,
  level: "rising",
  badgeCount: 6,
  sixBadgesAt: "2025-12-05T16:30:00.000Z",
  lastLoginAt: "2025-12-31T17:05:00.000Z",
  role: "admin",
  envAdmin: false,
  department: { id: "d", name: "CEVC1" },
  ...patch,
});

describe("toAdminUserCsvRow", () => {
  it("has the table columns without Actions, in table order", () => {
    expect(USER_CSV_HEADER).toEqual([
      "ID",
      "User",
      "Email",
      "Sent Kudos",
      "Received Kudos",
      "Total Heart",
      "Level",
      "Number of Badges",
      "Time to get 6 Badges",
      "Last Logged in",
      "Role",
    ]);
  });

  it("maps a row with the full id, numbers, the Hero tier name and instants in ADMIN_TIMEZONE", () => {
    expect(toAdminUserCsvRow(row())).toEqual([
      "0b5d7a3e-8f1c-4c2a-9d4e-1f2a3b4c5d6e",
      "Nguyễn Văn A",
      "a@sun-asterisk.com",
      3,
      7,
      12,
      "Rising Hero",
      6,
      "05/12/2025 23:30",
      "01/01/2026 00:05",
      "Admin",
    ]);
  });

  it("leaves no-value cells empty (no tier, no 6-badge time, never logged in)", () => {
    const cells = toAdminUserCsvRow(row({ level: null, sixBadgesAt: null, lastLoginAt: null, role: "user", badgeCount: 0 }));
    expect(cells.slice(6)).toEqual(["", 0, "", "", "User"]);
  });
});

describe("serializeAdminUserCsv", () => {
  it("neutralises formula names and emails (FR-603) and starts with a BOM", () => {
    const csv = serializeAdminUserCsv([row({ name: "=HYPERLINK(\"http://evil\",\"x\")", email: "+cmd@sun-asterisk.com" })]);
    expect(csv.startsWith("﻿ID,User,Email,")).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"",""x"")",'+cmd@sun-asterisk.com,`);
  });
});
