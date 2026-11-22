import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { KudoAdminQuery } from "@/features/admin-moderation/server/kudo-admin-query";
import { KudoModerationService } from "@/features/admin-moderation/server/kudo-moderation-service";
import { updateKudo } from "@/features/kudos-authoring/server/update-kudo-action";
import { listHighlightKudos } from "@/features/kudos-feed/server/kudo-highlight-query";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { openWriting } from "../kudos-authoring/event-end-override";
import { activeHashtagIds, cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { createProbeHashtags, deleteProbeHashtags, insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { addHearts, filterOf, heartRowCount, makeAdmin, moderationOf } from "./admin-moderation-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("@/shared/config/env", async (original) =>
  (await import("../kudos-authoring/event-end-override")).withEventEndOverride(await original<{ env: object }>()),
);

/**
 * Effects of moderation on the public read paths (FR-304, FR-404, BR-003, C-13, C-17, D006, SC-003):
 * a spam Kudo leaves the feed, Highlight and detail for everyone but its owner (`includeOwnSpam`,
 * `findForViewer`), hearts are untouched, Un Spam restores it; the anonymous sender stays masked in
 * every public read — also for an admin viewer — and appears only in the admin query; phase 04
 * refuses to edit a spam Kudo.
 */
let owner: Sunner, recipient: Sunner, viewer: Sunner, admin: Sunner, fans: Sunner[];
let tag: { id: string; label: string };
let kudoId: string;

beforeAll(async () => {
  [owner, recipient, viewer, admin, ...fans] = await Promise.all(
    ["vis-owner", "vis-recipient", "vis-viewer", "vis-admin", "vis-fan1", "vis-fan2"].map((prefix) => createSunner(prefix, `${prefix} Họ Tên`)),
  );
  await makeAdmin(admin);
  [tag] = await createProbeHashtags(1);
});
beforeEach(async () => {
  kudoId = await insertKudo({ sender: owner, recipient, nickname: "Sương Mù", body: "Cảm ơn thầm lặng", hashtagIds: [tag.id] });
  await addHearts(kudoId, fans);
});
afterAll(async () => {
  await cleanupSunners([owner, recipient, viewer, admin, ...fans]);
  await deleteProbeHashtags([tag.id]);
  await closeAppDb();
});

const feedIds = async (viewerId: string) =>
  (await KudoPublicQuery.list({ viewerId, locale: "vi", recipientId: recipient.id })).items.map((item) => item.id);
const highlightIds = async (viewerId: string) =>
  (await listHighlightKudos({ viewerId, locale: "vi", hashtagId: tag.id })).items.map((item) => item.id);

describe("public reads after Mark Spam / Un Spam", () => {
  it("hides a spam kudo from others (admins included), keeps it for its owner, keeps hearts, and Un Spam restores it", async () => {
    await KudoModerationService.transition(kudoId, "spam", admin.id);
    for (const other of [viewer.id, admin.id]) {
      expect(await feedIds(other)).not.toContain(kudoId);
      expect(await highlightIds(other)).not.toContain(kudoId);
      expect(await KudoPublicQuery.findForViewer(kudoId, other, "vi")).toBeNull();
    }
    const ownList = await KudoPublicQuery.list({ viewerId: owner.id, senderId: owner.id, includeOwnSpam: true, locale: "vi" });
    expect(ownList.items.find((item) => item.id === kudoId)).toMatchObject({ isSpam: true, isOwner: true });
    expect(await KudoPublicQuery.findForViewer(kudoId, owner.id, "vi")).toMatchObject({ id: kudoId, isSpam: true });
    expect(await heartRowCount(kudoId)).toBe(fans.length);

    await KudoModerationService.transition(kudoId, "public", admin.id);
    expect(await feedIds(viewer.id)).toContain(kudoId);
    expect(await highlightIds(viewer.id)).toContain(kudoId);
    expect(await KudoPublicQuery.findForViewer(kudoId, viewer.id, "vi")).toMatchObject({ id: kudoId, isSpam: false, heartCount: fans.length });
  });

  it("masks the anonymous sender (and the moderator) in every public read after moderation; only the admin query shows them", async () => {
    await KudoModerationService.transition(kudoId, "spam", admin.id);
    await KudoModerationService.transition(kudoId, "public", admin.id);
    const secrets = [owner.id, owner.email, owner.fullName, admin.id, admin.fullName];
    for (const reader of [viewer.id, admin.id]) {
      const payloads = [
        await KudoPublicQuery.list({ viewerId: reader, locale: "vi", recipientId: recipient.id }),
        await listHighlightKudos({ viewerId: reader, locale: "vi", hashtagId: tag.id }),
        await KudoPublicQuery.findForViewer(kudoId, reader, "vi"),
      ].map((payload) => JSON.stringify(payload));
      expect(payloads.every((json) => json.includes(kudoId) && !secrets.some((secret) => json.includes(secret)))).toBe(true);
    }
    const adminPage = await KudoAdminQuery.list(filterOf({ receiverId: recipient.id }), "vi");
    expect(adminPage.rows.find((row) => row.id === kudoId)).toMatchObject({
      sender: { id: owner.id, name: owner.fullName, email: owner.email },
      isAnonymous: true,
      moderatedBy: { id: admin.id, name: admin.fullName },
    });
  });
});

describe("phase 04 edit lock (D006)", () => {
  it("refuses the owner's edit of a spam kudo with SPAM_LOCKED and leaves it as it was", async () => {
    const tags = await activeHashtagIds(1);
    const ownKudo = await insertKudo({ sender: owner, recipient, body: "Bản gốc", hashtagIds: tags });
    await KudoModerationService.transition(ownKudo, "spam", admin.id);
    const before = await moderationOf(ownKudo);
    requestCookies.clear();
    openWriting();
    await signInToJar(requestCookies, owner.email);
    expect(await updateKudo(ownKudo, { title: "Sửa lén", body: "Bản sửa", hashtagIds: tags })).toEqual({ ok: false, code: "SPAM_LOCKED" });
    expect(await moderationOf(ownKudo)).toEqual(before);
    const [view] = (await KudoPublicQuery.list({ viewerId: owner.id, senderId: owner.id, includeOwnSpam: true, locale: "vi" })).items.filter(
      (item) => item.id === ownKudo,
    );
    expect(view).toMatchObject({ body: "Bản gốc", title: null, isSpam: true });
  });
});
