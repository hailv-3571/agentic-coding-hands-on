import { NextRequest } from "next/server";
import { testSql } from "../../setup/integration-db";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo, setAvatar } from "../kudos-feed/kudo-feed-fixtures";

/**
 * Phase 12 profile world on the local Supabase stack (SQL-seeded, explicit `created_at`):
 *  - owner → peer: 16 sent kudos, 12 public (2 anonymous "Bóng Đêm") and 4 spam (one anonymous),
 *    interleaved in time, with a public and a spam kudo sharing one `created_at` at ranks 10/11 so
 *    the tie straddles the first page boundary (page size 10).
 *  - ghost → owner: anonymous only ("Gió Lạ"): 2 public + 1 spam. Ghost's identity must never leave.
 *  - third → owner: 1 public + 1 spam, named. peer → owner: 1 public, named.
 * So owner's "Đã nhận" = 4 public, "Đã gửi" = 16 (12 public + 4 own spam); peer's "Đã nhận" = 12.
 */
export type ProfileWorld = {
  owner: Sunner;
  peer: Sunner;
  ghost: Sunner;
  third: Sunner;
  ownerSpamIds: string[];
  ownerAnonymousIds: string[];
  ghostSpamId: string;
  thirdSpamId: string;
};

export const GHOST_AVATAR = "https://lh3.googleusercontent.com/profile-ghost-secret.png";
export const GHOST_NICKNAME = "Gió Lạ";
export const OWNER_NICKNAME = "Bóng Đêm";

const at = (second: number) => new Date(Date.UTC(2104, 0, 1, 0, 0, second)).toISOString();

/** Rank 1 = newest. Spam at ranks 2, 7, 11, 16 (16 also anonymous); anonymous public at 4 and 13. */
const SENT_PLAN = Array.from({ length: 16 }, (_unused, index) => {
  const rank = index + 1;
  return {
    rank,
    // Ranks 10 and 11 share one instant: the public/spam tie sits on the page boundary.
    second: rank === 11 ? 100 - 10 : 100 - rank,
    spam: [2, 7, 11, 16].includes(rank),
    anonymous: [4, 13, 16].includes(rank),
  };
});

export async function seedProfileWorld(prefix: string): Promise<ProfileWorld> {
  const [owner, peer, ghost, third] = await Promise.all([
    createSunner(`${prefix}-owner`, "Profile Owner"),
    createSunner(`${prefix}-peer`, "Profile Peer"),
    createSunner(`${prefix}-ghost`, "Profile Ghost Sender"),
    createSunner(`${prefix}-third`, "Profile Third Sender"),
  ]);
  await setAvatar(ghost, GHOST_AVATAR);
  const ownerSpamIds: string[] = [];
  const ownerAnonymousIds: string[] = [];
  for (const kudo of SENT_PLAN) {
    const id = await insertKudo({
      sender: owner,
      recipient: peer,
      body: `Gửi lần ${kudo.rank}`,
      nickname: kudo.anonymous ? OWNER_NICKNAME : null,
      status: kudo.spam ? "spam" : "public",
      createdAt: at(kudo.second),
    });
    if (kudo.spam) ownerSpamIds.push(id);
    if (kudo.anonymous) ownerAnonymousIds.push(id);
  }
  await insertKudo({ sender: ghost, recipient: owner, nickname: GHOST_NICKNAME, createdAt: at(200) });
  await insertKudo({ sender: ghost, recipient: owner, nickname: GHOST_NICKNAME, createdAt: at(201) });
  const ghostSpamId = await insertKudo({ sender: ghost, recipient: owner, nickname: GHOST_NICKNAME, status: "spam", createdAt: at(202) });
  await insertKudo({ sender: third, recipient: owner, createdAt: at(203) });
  const thirdSpamId = await insertKudo({ sender: third, recipient: owner, status: "spam", createdAt: at(204) });
  await insertKudo({ sender: peer, recipient: owner, createdAt: at(205) });
  return { owner, peer, ghost, third, ownerSpamIds, ownerAnonymousIds, ghostSpamId, thirdSpamId };
}

export async function cleanupProfileWorld(world: ProfileWorld | undefined): Promise<void> {
  if (world) await cleanupSunners([world.owner, world.peer, world.ghost, world.third]);
}

/** Every kudo `owner` sent that its own "Đã gửi" must show, in `(created_at, id)` DESC order. */
export async function expectedSentOrder(ownerId: string): Promise<string[]> {
  const rows = await testSql<{ id: string }[]>`
    select id from public.kudos where sender_id = ${ownerId} and status in ('public', 'spam')
    order by created_at desc, id desc`;
  return rows.map((row) => row.id);
}

type RouteHandler<P> = (request: NextRequest, context: { params: Promise<P> }) => Promise<Response>;

/** Calls a dynamic route handler the way Next does (params as a promise) and reads the JSON. */
export async function callRoute<P>(handler: RouteHandler<P>, path: string, params: P) {
  const response = await handler(new NextRequest(`http://localhost:3000${path}`), { params: Promise.resolve(params) });
  const text = await response.text();
  return { status: response.status, cacheControl: response.headers.get("cache-control"), text, json: JSON.parse(text) };
}
