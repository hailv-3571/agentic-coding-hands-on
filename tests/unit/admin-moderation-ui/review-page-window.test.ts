import { describe, expect, it } from "vitest";
import { pageWindow } from "@/features/admin-moderation/components/review-page-window";

describe("pageWindow", () => {
  it("shows every page when there are at most five", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(5, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps the current page centred when it can", () => {
    expect(pageWindow(6, 20)).toEqual([4, 5, 6, 7, 8]);
  });

  it("stops at the first and the last page", () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(2, 20)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(20, 20)).toEqual([16, 17, 18, 19, 20]);
    expect(pageWindow(19, 20)).toEqual([16, 17, 18, 19, 20]);
  });

  it("is empty when there is nothing to page", () => {
    expect(pageWindow(1, 0)).toEqual([]);
  });
});
