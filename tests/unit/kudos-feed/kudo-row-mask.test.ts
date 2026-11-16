import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { KudoPublicRow } from "@/features/kudos-feed/server/kudo-public-select";
import { maskKudoRow } from "@/features/kudos-feed/server/kudo-row-mask";

/**
 * FR-602 / BR-003: Drizzle bypasses RLS, so this mapper is the security boundary. An anonymous
 * Kudo's card never carries the sender's id, name, email, avatar or department; `isOwner` is the
 * only ownership signal and it is computed here, server-side.
 */
const senderId = randomUUID();
const recipientId = randomUUID();
const departmentId = randomUUID();
const related = {
  hashtags: [{ id: randomUUID(), label: "#BE A TEAM" }],
  images: [{ position: 0, url: "http://127.0.0.1:54321/storage/v1/object/sign/kudo-images/kudos/a.png?token=t" }],
};

function row(overrides: Partial<KudoPublicRow> = {}): KudoPublicRow {
  return {
    id: randomUUID(),
    title: "Người truyền lửa",
    body: "Cảm ơn **bạn**",
    isAnonymous: false,
    anonymousNickname: null,
    status: "public",
    createdAt: new Date("2026-11-16T03:04:05.123Z"),
    cursorAt: "2026-11-16T03:04:05.123456Z",
    senderId,
    senderName: "Sender Secret Name",
    senderAvatarUrl: "https://lh3.googleusercontent.com/sender-secret.png",
    senderDepartmentId: departmentId,
    senderDepartmentCode: "SECRETDEPT",
    recipientId,
    recipientName: "Recipient Name",
    recipientAvatarUrl: null,
    recipientDepartmentId: departmentId,
    recipientDepartmentCode: "CEVC1",
    ...overrides,
  };
}

const anonymous = () => row({ isAnonymous: true, anonymousNickname: "Mèo Mun" });

describe("maskKudoRow", () => {
  it("maps a named Kudo to the card view with an explicit whitelist of fields", () => {
    const source = row();
    expect(maskKudoRow(source, recipientId, related)).toEqual({
      id: source.id,
      sender: {
        anonymous: false,
        id: senderId,
        name: "Sender Secret Name",
        avatarUrl: "https://lh3.googleusercontent.com/sender-secret.png",
        department: { id: departmentId, code: "SECRETDEPT" },
        tier: null,
      },
      recipient: { id: recipientId, name: "Recipient Name", avatarUrl: null, department: { id: departmentId, code: "CEVC1" }, tier: null },
      title: "Người truyền lửa",
      body: "Cảm ơn **bạn**",
      hashtags: related.hashtags,
      images: related.images,
      createdAt: "2026-11-16T03:04:05.123Z",
      isOwner: false,
      isSpam: false,
    });
  });

  it("replaces an anonymous sender with the nickname only", () => {
    const view = maskKudoRow(anonymous(), recipientId, related);
    expect(view.sender).toEqual({ anonymous: true, nickname: "Mèo Mun" });
  });

  it.each([
    ["a stranger", randomUUID()],
    ["the recipient", recipientId],
    ["the anonymous owner", senderId],
  ])("leaks no sender identifier of an anonymous Kudo to %s", (_label, viewerId) => {
    const payload = JSON.stringify(maskKudoRow(anonymous(), viewerId, related));
    for (const secret of [senderId, "Sender Secret Name", "sender-secret.png", "SECRETDEPT"]) {
      expect(payload).not.toContain(secret);
    }
    expect(payload).not.toMatch(/senderId|senderName|email|avatar":"https/i);
  });

  it("computes isOwner from the viewer, also for the owner's own anonymous Kudo", () => {
    expect(maskKudoRow(anonymous(), senderId, related).isOwner).toBe(true);
    expect(maskKudoRow(anonymous(), recipientId, related).isOwner).toBe(false);
    expect(maskKudoRow(row(), senderId, related).isOwner).toBe(true);
  });

  it("flags spam rows (only ever loaded for their owner) and keeps public rows unflagged", () => {
    expect(maskKudoRow(row({ status: "spam" }), senderId, related).isSpam).toBe(true);
    expect(maskKudoRow(row(), senderId, related).isSpam).toBe(false);
  });

  it("sends a null department for a Sunner without one", () => {
    const view = maskKudoRow(row({ recipientDepartmentId: null, recipientDepartmentCode: null }), senderId, related);
    expect(view.recipient.department).toBeNull();
  });

  it("never copies raw row fields onto the view", () => {
    const view = maskKudoRow(anonymous(), senderId, related);
    expect(Object.keys(view).sort()).toEqual(
      ["body", "createdAt", "hashtags", "id", "images", "isOwner", "isSpam", "recipient", "sender", "title"].sort(),
    );
  });
});
