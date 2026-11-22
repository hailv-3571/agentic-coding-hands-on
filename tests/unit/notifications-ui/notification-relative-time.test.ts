import { describe, expect, it } from "vitest";
import { formatNotificationRelativeTime } from "@/features/notifications/lib/notification-relative-time";

const NOW = new Date("2026-11-23T12:00:00.000Z");
const ago = (milliseconds: number) => new Date(NOW.getTime() - milliseconds).toISOString();
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatNotificationRelativeTime (Figma: 15 phút trước, 1 giờ trước, 1 ngày trước, 1 tuần trước, 1 tháng trước)", () => {
  it.each([
    [ago(15 * MINUTE), "15 phút trước", "15 minutes ago"],
    [ago(1 * HOUR), "1 giờ trước", "1 hour ago"],
    [ago(1 * DAY), "1 ngày trước", "1 day ago"],
    [ago(7 * DAY), "1 tuần trước", "1 week ago"],
    [ago(30 * DAY), "1 tháng trước", "1 month ago"],
  ])("formats the Figma samples in vi and en (%s)", (iso, vi, en) => {
    expect(formatNotificationRelativeTime(iso, NOW, "vi")).toBe(vi);
    expect(formatNotificationRelativeTime(iso, NOW, "en")).toBe(en);
  });

  it("says just now under one minute, and for a slightly future instant (clock skew)", () => {
    expect(formatNotificationRelativeTime(ago(59 * SECOND), NOW, "vi")).toBe("Vừa xong");
    expect(formatNotificationRelativeTime(ago(0), NOW, "en")).toBe("Just now");
    expect(formatNotificationRelativeTime(ago(-30 * SECOND), NOW, "vi")).toBe("Vừa xong");
  });

  it("picks the largest whole unit at each boundary (floors, never rounds up)", () => {
    expect(formatNotificationRelativeTime(ago(60 * SECOND), NOW, "vi")).toBe("1 phút trước");
    expect(formatNotificationRelativeTime(ago(59 * MINUTE + 59 * SECOND), NOW, "vi")).toBe("59 phút trước");
    expect(formatNotificationRelativeTime(ago(23 * HOUR + 59 * MINUTE), NOW, "en")).toBe("23 hours ago");
    expect(formatNotificationRelativeTime(ago(6 * DAY + 23 * HOUR), NOW, "vi")).toBe("6 ngày trước");
    expect(formatNotificationRelativeTime(ago(29 * DAY), NOW, "vi")).toBe("4 tuần trước");
    expect(formatNotificationRelativeTime(ago(364 * DAY), NOW, "en")).toBe("12 months ago");
    expect(formatNotificationRelativeTime(ago(365 * DAY), NOW, "vi")).toBe("1 năm trước");
    expect(formatNotificationRelativeTime(ago(800 * DAY), NOW, "en")).toBe("2 years ago");
  });

  it("returns an empty string for an unparseable instant instead of throwing", () => {
    expect(formatNotificationRelativeTime("not-a-date", NOW, "vi")).toBe("");
  });
});
