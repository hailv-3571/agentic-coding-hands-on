import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";
import { formatNotificationMessage, type NotificationTranslator } from "@/features/notifications/lib/notification-message";
import type { NotificationView } from "@/features/notifications/schemas/notification-views";

// The real root translators over the shipped messages; the cast drops the per-key typing that the
// JSON import adds (components use the untyped `useTranslations()`).
const tVi = createTranslator({ locale: "vi", messages: vi }) as unknown as NotificationTranslator;
const tEn = createTranslator({ locale: "en", messages: en }) as unknown as NotificationTranslator;

type Input = Pick<NotificationView, "type" | "params">;
const message = (input: Input, t = tVi) => formatNotificationMessage(input, t);

describe("formatNotificationMessage — kudo_received and the anonymous nickname rule", () => {
  it("names a non-anonymous sender (Figma copy)", () => {
    expect(message({ type: "kudo_received", params: { actorName: "Huỳnh Dương Xuân Nhật" } })).toEqual([
      "Sunner Huỳnh Dương Xuân Nhật vừa gửi đến bạn lời ghi nhận đầy yêu thương!",
    ]);
    expect(message({ type: "kudo_received", params: { actorName: "An Nguyen" } }, tEn)).toEqual([
      "Sunner An Nguyen just sent you a heartfelt Kudos!",
    ]);
  });

  it("shows the nickname marked anonymous and never a real name, even if one slipped into params", () => {
    const lines = message({ type: "kudo_received", params: { anonymousNickname: "Mèo Con", actorName: "Real Name" } });
    expect(lines).toEqual(["Sunner Mèo Con (ẩn danh) vừa gửi đến bạn lời ghi nhận đầy yêu thương!"]);
    expect(lines.join(" ")).not.toContain("Real Name");
  });

  it("falls back to the nameless anonymous copy when neither a name nor a nickname is present (D014)", () => {
    expect(message({ type: "kudo_received", params: {} })).toEqual([
      "Một Sunner ẩn danh vừa gửi đến bạn lời ghi nhận đầy yêu thương!",
    ]);
  });
});

describe("formatNotificationMessage — other types", () => {
  it("heart_received: Figma copy for one heart, the aggregated count for several", () => {
    expect(message({ type: "heart_received", params: { recipientName: "Bình", count: 1 } })).toEqual([
      "Wow! Lời nhắn gửi của bạn cho Sunner Bình vừa nhận thêm lượt tim!",
    ]);
    expect(message({ type: "heart_received", params: { recipientName: "Bình", count: 3 } })).toEqual([
      "Wow! Lời nhắn gửi của bạn cho Sunner Bình vừa nhận thêm 3 lượt tim!",
    ]);
    expect(message({ type: "heart_received", params: { recipientName: "Binh" } }, tEn)).toEqual([
      "Wow! Your Kudos to Sunner Binh just got another heart!",
    ]);
  });

  it("secret_box_granted: fixed copy", () => {
    expect(message({ type: "secret_box_granted", params: {} })).toEqual([
      "Chúc mừng! Bạn vừa nhận được lượt mở Secret Box mới! Click vào đây để mở ngay nhé!",
    ]);
  });

  it("hero_tier_up: count and the localized tier name, then the encouragement line", () => {
    expect(message({ type: "hero_tier_up", params: { senderCount: 21, tier: "legend" } })).toEqual([
      "Bạn nhận được 21 lời nhắn gửi từ đồng nghiệp và thăng hạng Legend Hero!",
      "Tiếp tục lan tỏa năng lượng tích cực đến đồng nghiệp nhé!",
    ]);
  });

  it("kudo_hidden_spam: fixed copy (the standards link is rendered separately)", () => {
    expect(message({ type: "kudo_hidden_spam", params: {} })).toEqual([
      "Tiếc quá! Bạn có một lời nhắn bị tạm ẩn vì \"vướng\" một số tiêu chuẩn! Hãy xem các tiêu chuẩn và gửi lại cho đồng đội nhé!",
    ]);
  });

  it("icon_set_completed: names the gift", () => {
    expect(message({ type: "icon_set_completed", params: { giftName: "Tai nghe" } })).toEqual([
      "Chúc mừng bạn đã thu thập đủ 6 huy hiệu của SAA. Bạn đã nhận được phần quà từ BTC chính là Tai nghe. BTC sẽ liên hệ để gửi quà đến bạn vào cuối sự kiện.",
    ]);
  });

  it("national_kudos: placeholder copy with the rank, and without it when the rank is missing", () => {
    expect(message({ type: "national_kudos", params: { rank: 2 } })[0]).toContain("hạng 2");
    expect(message({ type: "national_kudos", params: {} })[0]).toContain("Kudos Quốc Dân");
    expect(message({ type: "national_kudos", params: {} })[0]).not.toContain("hạng");
  });
});
