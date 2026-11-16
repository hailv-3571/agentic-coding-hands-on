import { describe, expect, it } from "vitest";
import { HEART_ERROR_STATUS } from "@/features/kudos-hearts/schemas/kudo-heart-result";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

/** Every code a heart action can return has a message in both locales (kudosHearts.errors). */
describe("kudosHearts.errors messages", () => {
  it.each([
    ["vi", vi],
    ["en", en],
  ])("covers every heart error code in %s", (_locale, messages) => {
    const errors = messages.kudosHearts.errors as Record<string, unknown>;
    for (const code of Object.keys(HEART_ERROR_STATUS)) expect(errors[code], code).toEqual(expect.any(String));
  });

  it("uses the spec sentences verbatim", () => {
    expect(vi.kudosHearts.errors).toMatchObject({
      SELF_HEART: "Bạn không thể thả tim cho Kudo của mình",
      KUDO_UNAVAILABLE: "Kudo này không còn khả dụng",
      UNEXPECTED: "Không thể cập nhật, vui lòng thử lại",
    });
    expect(HEART_ERROR_STATUS).toEqual({ SELF_HEART: 403, KUDO_UNAVAILABLE: 404, EVENT_ENDED: 409, UNEXPECTED: 500 });
  });
});
