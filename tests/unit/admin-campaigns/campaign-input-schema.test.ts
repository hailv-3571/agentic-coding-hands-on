import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env", () => ({ env: { ADMIN_TIMEZONE: "Asia/Ho_Chi_Minh" } }));

const { CAMPAIGN_NAME_MAX_LENGTH, CampaignCreateSchema, CampaignUpdateSchema, campaignFieldErrors, campaignWindowErrors } =
  await import("@/features/admin-campaigns/schemas/campaign-input-schema");

/**
 * BR-003 / BR-006: name 1..100 after trim, `yyyy-MM-ddTHH:mm` (year 2000 or later) read in
 * ADMIN_TIMEZONE, end > start and > now. The conversion itself: zoned-date-time-to-utc.test.ts.
 */
const valid = { name: "Campaign x2 heart release landing page", startsAt: "2101-12-23T10:00", endsAt: "2101-12-24T10:00" };
const errorsOf = (input: unknown) => {
  const parsed = CampaignCreateSchema.safeParse(input);
  return parsed.success ? null : campaignFieldErrors(parsed.error.issues);
};

describe("CampaignCreateSchema", () => {
  it("accepts a valid form and trims the name", () => {
    expect(CampaignCreateSchema.parse({ ...valid, name: "  x2 heart  " })).toEqual({ ...valid, name: "x2 heart" });
  });

  it(`limits the name to 1..${CAMPAIGN_NAME_MAX_LENGTH} characters after trim`, () => {
    expect(CAMPAIGN_NAME_MAX_LENGTH).toBe(100);
    expect(errorsOf({ ...valid, name: "đ".repeat(100) })).toBeNull();
    expect(errorsOf({ ...valid, name: "   " })).toEqual({ name: ["nameRequired"] });
    expect(errorsOf({ ...valid, name: "a".repeat(101) })).toEqual({ name: ["nameRequired"] });
    expect(errorsOf({ ...valid, name: undefined })).toEqual({ name: ["nameRequired"] });
  });

  it("requires both instants", () => {
    expect(errorsOf({ name: "x2", startsAt: "", endsAt: "" })).toEqual({
      startsAt: ["startRequired"],
      endsAt: ["endRequired"],
    });
    expect(errorsOf({ name: "x2" })).toEqual({ startsAt: ["startRequired"], endsAt: ["endRequired"] });
  });

  it.each([
    "2101-12-23 10:00",
    "2101-12-23T10:00:00",
    "2101-12-23T10:00Z",
    "2101-12-23T10:00+07:00",
    "2101-02-29T10:00",
    "2101-12-32T10:00",
    "2101-12-23T24:00",
    "2101-12-23T10:60",
  ])("rejects %s as not a datetime-local value", (startsAt) => {
    expect(errorsOf({ ...valid, startsAt })).toEqual({ startsAt: ["invalidDateTime"] });
  });

  it.each(["0050-01-01T10:00", "0000-02-29T10:00", "1999-12-31T23:59"])(
    "rejects %s: campaign years start at 2000 (a typo, not a window)",
    (startsAt) => {
      expect(errorsOf({ ...valid, startsAt })).toEqual({ startsAt: ["invalidDateTime"] });
    },
  );

  it("accepts the first minute of 2000 as a start", () => {
    expect(errorsOf({ ...valid, startsAt: "2000-01-01T00:00" })).toBeNull();
  });
});

describe("CampaignUpdateSchema", () => {
  it("takes a positive integer id and an optional startsAt (kept from the row when absent)", () => {
    const withoutStart = { name: valid.name, endsAt: valid.endsAt };
    expect(CampaignUpdateSchema.parse({ id: 3, ...withoutStart })).toEqual({ id: 3, ...withoutStart });
    expect(CampaignUpdateSchema.safeParse({ id: 0, ...valid }).success).toBe(false);
    expect(CampaignUpdateSchema.safeParse({ id: "3", ...valid }).success).toBe(false);
  });
});

describe("campaignWindowErrors", () => {
  const now = new Date("2101-12-23T05:00:00.000Z");
  const window = (startsAt: string, endsAt: string) => ({ startsAt: new Date(startsAt), endsAt: new Date(endsAt) });

  it("accepts an end after the start and after now, even with a start in the past (D005)", () => {
    expect(campaignWindowErrors(window("2101-12-22T00:00:00Z", "2101-12-23T05:01:00Z"), now)).toBeNull();
  });

  it("rejects an end equal to or before the start", () => {
    expect(campaignWindowErrors(window("2101-12-24T03:00:00Z", "2101-12-24T03:00:00Z"), now)).toEqual({
      endsAt: ["endBeforeStart"],
    });
    expect(campaignWindowErrors(window("2101-12-24T03:00:00Z", "2101-12-24T02:59:00Z"), now)).toEqual({
      endsAt: ["endBeforeStart"],
    });
  });

  it("rejects an end equal to or before now", () => {
    expect(campaignWindowErrors(window("2101-12-23T00:00:00Z", "2101-12-23T05:00:00Z"), now)).toEqual({
      endsAt: ["endInPast"],
    });
  });
});
