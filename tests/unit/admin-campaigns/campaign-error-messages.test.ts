import { describe, expect, it } from "vitest";
import { CAMPAIGN_ERROR_STATUS } from "@/features/admin-campaigns/schemas/campaign-admin-result";
import { CAMPAIGN_FIELD_ERROR_KEYS } from "@/features/admin-campaigns/schemas/campaign-input-schema";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

/** Every code and field error key a campaign action can return has a message (adminCampaigns.errors). */
describe("adminCampaigns.errors messages", () => {
  it.each([
    ["vi", vi],
    ["en", en],
  ])("covers every campaign error code, field key and the overlap detail in %s", (_locale, messages) => {
    const errors = messages.adminCampaigns.errors as Record<string, unknown> & { fields: Record<string, unknown> };
    for (const code of Object.keys(CAMPAIGN_ERROR_STATUS)) expect(errors[code], code).toEqual(expect.any(String));
    for (const key of CAMPAIGN_FIELD_ERROR_KEYS) expect(errors.fields[key], key).toEqual(expect.any(String));
    expect(errors.overlapWith).toEqual(expect.stringContaining("{name}"));
  });

  it("uses the spec sentences verbatim", () => {
    expect(vi.adminCampaigns.errors).toMatchObject({
      NOT_FOUND: "Chiến dịch không còn tồn tại",
      ENDED: "Chiến dịch đã kết thúc, không thể sửa hoặc xoá",
      UNEXPECTED: "Không lưu được, vui lòng thử lại",
      overlapWith: "Khoảng thời gian trùng với chiến dịch {name} ({startsAt} - {endsAt})",
    });
    expect(vi.adminCampaigns.errors.fields).toMatchObject({
      nameRequired: "Vui lòng nhập tên chiến dịch (tối đa 100 ký tự)",
      endBeforeStart: "Giờ kết thúc phải sau giờ bắt đầu",
      endInPast: "Giờ kết thúc phải sau thời điểm hiện tại",
    });
  });
});
