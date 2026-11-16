import { describe, expect, it } from "vitest";
import { kudoCardCanEdit } from "@/features/kudos-feed/components/kudo-card-can-edit";

describe("kudoCardCanEdit (owner pen on a feed card)", () => {
  // [isOwner, isSpam, writingOpen] → expected. Covers every combination once.
  const truthTable: [boolean, boolean, boolean, boolean][] = [
    [true, false, true, true],
    [true, false, false, false],
    [true, true, true, false],
    [true, true, false, false],
    [false, false, true, false],
    [false, false, false, false],
    [false, true, true, false],
    [false, true, false, false],
  ];

  it.each(truthTable)("isOwner=%s isSpam=%s writingOpen=%s → %s", (isOwner, isSpam, writingOpen, expected) => {
    expect(kudoCardCanEdit({ isOwner, isSpam, writingOpen })).toBe(expected);
  });

  it("hides the pen once writing has closed, even for the owner of a clean Kudo", () => {
    expect(kudoCardCanEdit({ isOwner: true, isSpam: false, writingOpen: false })).toBe(false);
  });
});
