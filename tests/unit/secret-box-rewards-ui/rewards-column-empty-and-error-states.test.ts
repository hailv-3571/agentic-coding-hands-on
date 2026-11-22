import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { RewardsColumn } from "@/features/secret-box-rewards/components/rewards-column";
import type { PersonalRewardStatsView, RewardsColumnData } from "@/features/secret-box-rewards/schemas/secret-box-views";
import { renderSecretBoxMarkup, textOf } from "./render-secret-box-markup";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

/**
 * Live board rewards column states (SCR-live-board-rewards-column § 5, FR-206): no gift winner yet →
 * "Chưa có Sunner nào nhận quà."; a failed query (`null`) → that panel's own alert with "Thử lại"
 * while the other panel still renders. The server seam passes `null` per failed panel.
 */
const stats: PersonalRewardStatsView = {
  kudosReceived: 3,
  kudosSent: 4,
  heartsReceived: 7,
  campaignActive: false,
  boxesOpened: 1,
  boxesUnopened: 2,
};
const column = (data: RewardsColumnData) => renderSecretBoxMarkup(createElement(RewardsColumn, { data }));
const alerts = (markup: string) => [...markup.matchAll(/<div role="alert"[^>]*>(.*?)<\/div>/g)].map((match) => textOf(match[1]));

describe("rewards column states", () => {
  it("shows the empty winners line when nobody has won a gift yet", () => {
    const markup = column({ stats, winners: [] });
    expect(markup).toContain('aria-live="polite"');
    expect(textOf(markup)).toContain("Chưa có Sunner nào nhận quà.");
    expect(markup).not.toContain("<ol");
    expect(alerts(markup)).toEqual([]);
  });

  it("keeps the stats when only the winners query failed: one alert with retry", () => {
    const markup = column({ stats, winners: null });
    expect(alerts(markup)).toEqual(["Không tải được danh sách nhận quà. Vui lòng thử lại. Thử lại"]);
    expect(textOf(markup)).toContain("Số Secret Box chưa mở: 2");
  });

  it("keeps the winners when only the stats query failed, with no stats rows", () => {
    const winners = [{ userId: "u1", name: "Nguyễn Văn A", avatarUrl: null, giftName: "Áo phông SAA", openedAt: "2026-11-22T00:00:00Z" }];
    const markup = column({ stats: null, winners });
    expect(alerts(markup)).toEqual(["Không tải được thống kê. Vui lòng thử lại. Thử lại"]);
    expect(markup).not.toContain("<dl");
    expect(textOf(markup)).toContain("Nguyễn Văn A Nhận được Áo phông SAA");
  });

  it("shows both alerts when both queries failed", () => {
    expect(alerts(column({ stats: null, winners: null }))).toHaveLength(2);
  });
});
