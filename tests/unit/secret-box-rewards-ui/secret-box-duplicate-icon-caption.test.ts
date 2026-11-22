import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { SecretBoxAnnouncement, SecretBoxPrizeName } from "@/features/secret-box-rewards/components/secret-box-modal-states";
import type { OpenerState } from "@/features/secret-box-rewards/components/secret-box-opener";
import type { OpenSecretBoxResult } from "@/features/secret-box-rewards/schemas/secret-box-views";
import { renderSecretBoxMarkup, textOf } from "./render-secret-box-markup";

/**
 * E08 "Bạn đã có icon này rồi" (SCR-secret-box-open § 7): under the box on an icon result whose
 * `duplicate` flag is set, and in the screen-reader announcement; never for a first copy or a gift.
 */
const CAPTION_VI = "Bạn đã có icon này rồi";
const icon: OpenSecretBoxResult = {
  kind: "icon",
  iconCode: "STAY_GOLD",
  name: "STAY GOLD",
  setCompleted: false,
  giftName: null,
  duplicate: false,
  unopenedLeft: 1,
  replayed: false,
};
const resultState = (result: OpenSecretBoxResult): OpenerState => ({ phase: "result", unopened: result.unopenedLeft, result, notice: null });
const prizeLine = (result: OpenSecretBoxResult, locale: "vi" | "en" = "vi") =>
  textOf(renderSecretBoxMarkup(createElement(SecretBoxPrizeName, { state: resultState(result) }), locale));
const announcement = (result: OpenSecretBoxResult) => textOf(renderSecretBoxMarkup(createElement(SecretBoxAnnouncement, { state: resultState(result) })));

describe("duplicate icon caption", () => {
  it("shows under the box and is announced when the icon was already owned", () => {
    expect(prizeLine({ ...icon, duplicate: true })).toBe(CAPTION_VI);
    expect(prizeLine({ ...icon, duplicate: true }, "en")).toBe("You already have this icon");
    expect(announcement({ ...icon, duplicate: true })).toBe(`Bạn nhận được icon STAY GOLD. ${CAPTION_VI}. Còn 1 Secret Box chưa mở.`);
  });

  it("stays hidden for a first copy and for a gift", () => {
    expect(prizeLine(icon)).toBe("");
    expect(announcement(icon)).not.toContain(CAPTION_VI);
    const gift: OpenSecretBoxResult = { ...icon, kind: "gift", iconCode: null, name: "Áo phông SAA" };
    expect(prizeLine(gift)).toBe("Áo phông SAA");
  });
});
