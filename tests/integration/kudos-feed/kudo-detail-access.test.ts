import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import * as seed from "./kudo-feed-fixtures";

/**
 * Detail access (C-17, FR-403, SC-005): a public Kudo opens for every Sunner; a spam Kudo opens
 * only for its sender, read-only (`isSpam: true`); everyone else gets the SAME null as for a
 * malformed or unknown id (the page answers one 404 — no existence oracle).
 */
let author: Sunner;
let recipient: Sunner;
let stranger: Sunner;
const k: Record<string, string> = {};

beforeAll(async () => {
  [author, recipient, stranger] = await Promise.all([
    createSunner("detail-author", "Detail Author"),
    createSunner("detail-recipient", "Detail Recipient"),
    createSunner("detail-stranger", "Detail Stranger"),
  ]);
  k.public = await seed.insertKudo({ sender: author, recipient, body: "**Cảm ơn** đầy đủ", title: "Ngôi sao" });
  k.anon = await seed.insertKudo({ sender: author, recipient, nickname: "Bí Ẩn" });
  k.spam = await seed.insertKudo({ sender: author, recipient, status: "spam" });
  k.anonSpam = await seed.insertKudo({ sender: author, recipient, nickname: "Bí Ẩn", status: "spam" });
  await seed.attachImages(k.public, [0, 1, 2]);
});
afterAll(async () => {
  await cleanupSunners([author, recipient, stranger]);
  await closeAppDb();
});

const find = (id: string, viewer: Sunner) => KudoPublicQuery.findForViewer(id, viewer.id, "vi");

describe("KudoPublicQuery.findForViewer", () => {
  it("returns the full card of a public Kudo to any Sunner", async () => {
    for (const viewer of [author, recipient, stranger]) {
      const view = await find(k.public, viewer);
      expect(view).toMatchObject({ id: k.public, body: "**Cảm ơn** đầy đủ", title: "Ngôi sao", isSpam: false });
      expect(view?.isOwner).toBe(viewer === author);
      expect(view?.images.map((image) => image.position)).toEqual([0, 1, 2]);
    }
  });

  it("masks the anonymous sender on the detail too", async () => {
    const view = await find(k.anon, stranger);
    expect(view?.sender).toEqual({ anonymous: true, nickname: "Bí Ẩn" });
    expect(JSON.stringify(view)).not.toContain(author.id);
  });

  it("opens a spam Kudo for its sender only, flagged isSpam, still masked when anonymous", async () => {
    expect(await find(k.spam, author)).toMatchObject({ id: k.spam, isSpam: true, isOwner: true });
    const ownAnonSpam = await find(k.anonSpam, author);
    expect(ownAnonSpam).toMatchObject({ isSpam: true, isOwner: true, sender: { anonymous: true, nickname: "Bí Ẩn" } });
    expect(JSON.stringify(ownAnonSpam)).not.toContain(author.id);
  });

  it("answers the same null for someone else's spam, an unknown id and a malformed id", async () => {
    const outcomes = await Promise.all([
      find(k.spam, recipient),
      find(k.spam, stranger),
      find(k.anonSpam, recipient),
      find("6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b", stranger),
      find("not-a-uuid", stranger),
      find("", stranger),
      find(`${k.public}' or '1'='1`, stranger),
      find(k.public.toUpperCase().replace(/-/g, ""), stranger),
    ]);
    expect(outcomes).toEqual(outcomes.map(() => null));
  });
});
