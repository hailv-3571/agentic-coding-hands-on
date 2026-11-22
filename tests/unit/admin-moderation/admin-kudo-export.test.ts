import { describe, expect, it, vi } from "vitest";
import type { AdminKudoRow } from "@/features/admin-moderation/schemas/admin-kudo-row";

vi.mock("@/shared/config/env", () => ({ env: { ADMIN_TIMEZONE: "Asia/Ho_Chi_Minh" } }));

const { ADMIN_KUDO_CSV_HEADER, adminKudoExportFilename, serializeAdminKudoCsv, toAdminKudoCsvRow } = await import(
  "@/features/admin-moderation/server/admin-kudo-export"
);

/** AdminKudoRow → CSV (plan § Architecture columns, D007, FR-604 / BR-004 via the phase 01 serializer). */
const row = (patch: Partial<AdminKudoRow> = {}): AdminKudoRow => ({
  id: "0b5d7a3e-8f1c-4c2a-9d4e-1f2a3b4c5d6e",
  shortId: "0b5d7a3e",
  createdAt: "2025-12-05T16:30:00.000Z",
  sender: { id: "s", name: "Nguyễn Văn A", email: "a@sun-asterisk.com" },
  isAnonymous: false,
  anonymousNickname: null,
  receiver: { id: "r", name: "Trần Thị B", email: "b@sun-asterisk.com" },
  title: "Người truyền lửa",
  message: "Cảm ơn bạn",
  hashtags: ["#BE A TEAM", "#BE OPTIMISTIC"],
  heartCount: 12,
  status: "public",
  moderatedBy: null,
  moderatedAt: null,
  ...patch,
});

describe("toAdminKudoCsvRow", () => {
  it("has the 13 planned columns, in order", () => {
    expect(ADMIN_KUDO_CSV_HEADER).toEqual([
      "ID",
      "Ngày gửi",
      "Người gửi",
      "Email người gửi",
      "Ẩn danh",
      "Người nhận",
      "Tiêu đề",
      "Lời nhắn",
      "Hashtag",
      "Tim",
      "Trạng thái",
      "Kiểm duyệt bởi",
      "Kiểm duyệt lúc",
    ]);
  });

  it("maps an unmoderated public kudo: full id, sent time in ADMIN_TIMEZONE, raw heart count", () => {
    expect(toAdminKudoCsvRow(row())).toEqual([
      "0b5d7a3e-8f1c-4c2a-9d4e-1f2a3b4c5d6e",
      "2025-12-05 23:30:00",
      "Nguyễn Văn A",
      "a@sun-asterisk.com",
      "Không",
      "Trần Thị B",
      "Người truyền lửa",
      "Cảm ơn bạn",
      "#BE A TEAM, #BE OPTIMISTIC",
      12,
      "Public",
      "",
      "",
    ]);
  });

  it("shows the real sender of an anonymous spam kudo, flagged Có, with the moderator and time", () => {
    const cells = toAdminKudoCsvRow(
      row({
        isAnonymous: true,
        anonymousNickname: "Gió Lạ",
        title: null,
        hashtags: [],
        heartCount: 0,
        status: "spam",
        moderatedBy: { id: "m", name: "Admin C" },
        moderatedAt: "2025-12-05T17:05:00.000Z",
      }),
    );
    expect(cells).toEqual([
      expect.any(String),
      "2025-12-05 23:30:00",
      "Nguyễn Văn A",
      "a@sun-asterisk.com",
      "Có",
      "Trần Thị B",
      "",
      "Cảm ơn bạn",
      "",
      0,
      "Spam",
      "Admin C",
      "2025-12-06 00:05:00",
    ]);
  });
});

describe("serializeAdminKudoCsv", () => {
  it("writes a BOM, the header and one CRLF line per row, neutralising formula cells", () => {
    const csv = serializeAdminKudoCsv([
      row({ title: '=HYPERLINK("http://evil","x")', message: "+cmd|' /C calc'!A0" }),
      row({ message: "@SUM(1,2)\nline 2", sender: { id: "s", name: "-1+1", email: "a@sun-asterisk.com" } }),
    ]);
    const lines = csv.split("\r\n");
    expect(csv.startsWith("﻿ID,Ngày gửi,")).toBe(true);
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain(`"'=HYPERLINK(""http://evil"",""x"")"`);
    expect(lines[1]).toContain(`'+cmd|' /C calc'!A0`);
    expect(csv).toContain(`"'@SUM(1,2)\nline 2"`);
    expect(lines[2]).toContain(",'-1+1,");
    expect(lines[3]).toBe("");
  });

  it("writes only the header for an empty result", () => {
    expect(serializeAdminKudoCsv([])).toBe(`﻿${ADMIN_KUDO_CSV_HEADER.join(",")}\r\n`);
  });
});

describe("adminKudoExportFilename", () => {
  it("is kudos-{yyyyMMdd-HHmm}.csv in ADMIN_TIMEZONE, across the UTC day boundary", () => {
    expect(adminKudoExportFilename(new Date("2025-12-05T16:30:59Z"))).toBe("kudos-20251205-2330.csv");
    expect(adminKudoExportFilename(new Date("2025-12-05T17:05:00Z"))).toBe("kudos-20251206-0005.csv");
  });
});
