import { describe, expect, it } from "vitest";
import {
  applyFilterPatch,
  heartAriaSort,
  nextHeartSort,
  reviewExportHref,
  reviewHref,
} from "@/features/admin-moderation/components/review-url-params";
import type { AdminKudoFilterValues } from "@/features/admin-moderation/schemas/admin-kudo-row";

const DEFAULTS: AdminKudoFilterValues = {
  page: 1,
  sort: "newest",
  status: null,
  senderId: null,
  receiverId: null,
  from: null,
  to: null,
  query: "",
};

const SENDER = "7b0c8f8e-6a4f-4f37-9a52-1f7c2a9d0e11";
const RECEIVER = "0d6f1c2b-3e4a-4b5c-8d7e-9f0a1b2c3d4e";

describe("reviewHref", () => {
  it("is the bare route for the default view (page 1, newest, no filter)", () => {
    expect(reviewHref(DEFAULTS)).toBe("/admin/review");
  });

  it("writes every active filter with the shared param names and a trimmed search", () => {
    const href = reviewHref({
      page: 3,
      sort: "hearts_asc",
      status: "spam",
      senderId: SENDER,
      receiverId: RECEIVER,
      from: "2026-12-01",
      to: "2026-12-05",
      query: "  người hùng ",
    });
    const params = new URL(href, "http://x").searchParams;
    expect(href.startsWith("/admin/review?")).toBe(true);
    expect(Object.fromEntries(params)).toEqual({
      q: "người hùng",
      sender: SENDER,
      receiver: RECEIVER,
      status: "spam",
      from: "2026-12-01",
      to: "2026-12-05",
      sort: "hearts_asc",
      page: "3",
    });
  });

  it("leaves out a whitespace-only search", () => {
    expect(reviewHref({ ...DEFAULTS, query: "   " })).toBe("/admin/review");
  });
});

describe("reviewExportHref", () => {
  it("carries the same filter and order but never the page", () => {
    const href = reviewExportHref({ ...DEFAULTS, page: 4, sort: "hearts_desc", status: "public", query: "abc" });
    expect(href).toBe("/api/admin/kudos/export?q=abc&status=public&sort=hearts_desc");
  });

  it("is the bare export route without filters", () => {
    expect(reviewExportHref({ ...DEFAULTS, page: 2 })).toBe("/api/admin/kudos/export");
  });
});

describe("applyFilterPatch", () => {
  const onPage5 = { ...DEFAULTS, page: 5, status: "public" as const };

  it("resets to page 1 on any filter, search or sort change (FR-402)", () => {
    expect(applyFilterPatch(onPage5, { senderId: SENDER })).toEqual({ ...onPage5, senderId: SENDER, page: 1 });
    expect(applyFilterPatch(onPage5, { query: "x" }).page).toBe(1);
    expect(applyFilterPatch(onPage5, { sort: "hearts_desc" }).page).toBe(1);
    expect(applyFilterPatch(onPage5, { status: null })).toEqual({ ...onPage5, status: null, page: 1 });
  });

  it("keeps the requested page when only the page changes", () => {
    expect(applyFilterPatch(onPage5, { page: 2 })).toEqual({ ...onPage5, page: 2 });
  });
});

describe("Heart column sort", () => {
  it("cycles newest → most hearts → fewest hearts → newest", () => {
    expect(nextHeartSort("newest")).toBe("hearts_desc");
    expect(nextHeartSort("hearts_desc")).toBe("hearts_asc");
    expect(nextHeartSort("hearts_asc")).toBe("newest");
  });

  it("reports the direction for aria-sort (none while sorted by date)", () => {
    expect(heartAriaSort("hearts_desc")).toBe("descending");
    expect(heartAriaSort("hearts_asc")).toBe("ascending");
    expect(heartAriaSort("newest")).toBe("none");
  });
});
