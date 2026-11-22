import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { HeroTierQuery } from "@/features/hero-badges/server/hero-tier-query";
import { KudoPublicQuery } from "@/features/kudos-feed/server/kudo-public-query";
import { closeAppDb } from "../auth/auth-test-users";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";

/**
 * Phase 05 seam `enrich-hero-tier.ts`, rewritten by phase 09: Live board cards carry the Hero tier
 * of the recipient and of a NAMED sender from one batch lookup. An anonymous sender has no id after
 * `maskKudoRow`, so its tier is never looked up or sent (FR-603), even when that person has a tier
 * of their own. A failed lookup logs and leaves every card without a badge (edge case A1).
 */
let ana: Sunner;
let binh: Sunner;
let chi: Sunner;
const at = (seconds: number) => new Date(Date.UTC(2102, 0, 1, 0, 0, seconds)).toISOString();

beforeAll(async () => {
  [ana, binh, chi] = await Promise.all([
    createSunner("hero-card-ana", "Ana Hero"),
    createSunner("hero-card-binh", "Binh Hero"),
    createSunner("hero-card-chi", "Chi Hero"),
  ]);
  await insertKudo({ sender: ana, recipient: binh, createdAt: at(3) });
  await insertKudo({ sender: chi, recipient: binh, createdAt: at(2) });
  // Binh (who has a tier: 2 senders) thanks Ana anonymously: Ana counts Binh as a sender (BR-003).
  await insertKudo({ sender: binh, recipient: ana, nickname: "Cáo Nhỏ", createdAt: at(1) });
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  await cleanupSunners([ana, binh, chi]);
  await closeAppDb();
});

const listFor = (recipient: Sunner) => KudoPublicQuery.list({ viewerId: chi.id, locale: "vi", recipientId: recipient.id });

describe("Kudo cards — Hero tiers (phase 09 seam)", () => {
  it("gives the recipient and a named sender their tier; a sender without senders has none", async () => {
    const [fromAna, fromChi] = (await listFor(binh)).items;
    expect([fromAna.recipient.tier, fromChi.recipient.tier]).toEqual(["new", "new"]);
    expect(fromAna.sender).toMatchObject({ anonymous: false, id: ana.id, tier: "new" });
    expect(fromChi.sender).toMatchObject({ anonymous: false, id: chi.id, tier: null });
  });

  it("looks tiers up once per page, with the recipient + named sender ids only", async () => {
    const lookup = vi.spyOn(HeroTierQuery, "getTiersByRecipientIds");
    await listFor(binh);
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(new Set(lookup.mock.calls[0][0])).toEqual(new Set([binh.id, ana.id, chi.id]));
  });

  it("never looks up or sends an anonymous sender's tier, though the recipient keeps theirs (FR-603)", async () => {
    const lookup = vi.spyOn(HeroTierQuery, "getTiersByRecipientIds");
    const [anonymousCard] = (await listFor(ana)).items;
    expect(anonymousCard.sender).toEqual({ anonymous: true, nickname: "Cáo Nhỏ" });
    expect(anonymousCard.recipient.tier).toBe("new");
    expect(lookup.mock.calls.flatMap(([ids]) => ids)).not.toContain(binh.id);
    expect(JSON.stringify(anonymousCard)).not.toContain(binh.id);
  });

  it("logs a failed lookup and renders every card without a badge", async () => {
    vi.spyOn(HeroTierQuery, "getTiersByRecipientIds").mockRejectedValueOnce(new Error("tier lookup down"));
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const cards = (await listFor(binh)).items;
    expect(cards).toHaveLength(2);
    expect(cards.flatMap((card) => [card.recipient.tier, card.sender.anonymous ? null : card.sender.tier])).toEqual([null, null, null, null]);
    expect(logged).toHaveBeenCalledWith("[kudos-feed] loading Hero tiers failed", expect.any(Error));
  });
});
