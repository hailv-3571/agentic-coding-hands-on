import { describe, expect, it } from "vitest";
import {
  formatBoxCount,
  newIdempotencyKey,
  orderIconSlots,
  secretBoxIconImage,
  secretBoxIconSlug,
} from "@/features/secret-box-rewards/components/secret-box-format";
import { SECRET_BOX_ICON_CODES } from "@/features/secret-box-rewards/schemas/secret-box-views";

describe("formatBoxCount", () => {
  it("pads to two digits like the Figma counter (05, 00) and never shows a negative", () => {
    expect(formatBoxCount(5)).toBe("05");
    expect(formatBoxCount(0)).toBe("00");
    expect(formatBoxCount(12)).toBe("12");
    expect(formatBoxCount(123)).toBe("123");
    expect(formatBoxCount(-1)).toBe("00");
    expect(formatBoxCount(Number.NaN)).toBe("00");
  });
});

describe("secret box icon assets", () => {
  it("maps every icon code to the phase 07 badge image and the Thể lệ message slug", () => {
    expect(secretBoxIconSlug("TOUCH_OF_LIGHT")).toBe("touch-of-light");
    expect(secretBoxIconImage("BEYOND_THE_BOUNDARY")).toEqual({
      src: "/images/awards-portal/badge-beyond-the-boundary.webp",
      width: 160,
      height: 240,
    });
    for (const code of SECRET_BOX_ICON_CODES) {
      expect(secretBoxIconImage(code).src).toBe(`/images/awards-portal/badge-${secretBoxIconSlug(code)}.webp`);
    }
  });
});

describe("orderIconSlots", () => {
  it("always returns the 6 slots in display order, filling missing ones as not owned", () => {
    const slots = orderIconSlots([
      { iconCode: "ROOT_FURTHER", owned: true, quantity: 2 },
      { iconCode: "REVIVAL", owned: true, quantity: 1 },
    ]);
    expect(slots.map((slot) => slot.iconCode)).toEqual([...SECRET_BOX_ICON_CODES]);
    expect(slots[0]).toEqual({ iconCode: "REVIVAL", owned: true, quantity: 1 });
    expect(slots[1]).toEqual({ iconCode: "TOUCH_OF_LIGHT", owned: false, quantity: 0 });
    expect(slots[5]).toEqual({ iconCode: "ROOT_FURTHER", owned: true, quantity: 2 });
  });
});

describe("newIdempotencyKey", () => {
  it("builds a uuid v4 from random bytes (works outside secure contexts)", () => {
    const key = newIdempotencyKey((bytes) => bytes.fill(0xff));
    expect(key).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
    const zero = newIdempotencyKey((bytes) => bytes.fill(0));
    expect(zero).toBe("00000000-0000-4000-8000-000000000000");
  });

  it("gives a different valid key on each call with the platform random source", () => {
    const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();
    expect(a).toMatch(uuidV4);
    expect(b).toMatch(uuidV4);
    expect(a).not.toBe(b);
  });
});
