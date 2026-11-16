import { describe, expect, it } from "vitest";
import { KUDO_ERROR_STATUS, KUDO_FIELD_ERROR_KEYS } from "@/features/kudos-authoring/schemas/kudo-write-result";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

/** Every code/field key the server can return has a message in both locales (kudosComposer.errors). */
describe("kudosComposer.errors messages", () => {
  it.each([
    ["vi", vi],
    ["en", en],
  ])("covers every error code and field error key in %s", (_locale, messages) => {
    const errors = messages.kudosComposer.errors as Record<string, unknown> & { fields: Record<string, unknown> };
    for (const code of Object.keys(KUDO_ERROR_STATUS)) expect(errors[code], code).toEqual(expect.any(String));
    for (const key of KUDO_FIELD_ERROR_KEYS) expect(errors.fields[key], key).toEqual(expect.any(String));
  });

  it("uses the DEC-001 sentence verbatim from Figma (frame 1949:13746)", () => {
    expect(vi.kudosComposer.errors.MISSING_REQUIRED).toBe("Bạn cần điền đủ Người nhận, Lời nhắn gửi và Hashtag để gửi Kudos!");
  });
});
