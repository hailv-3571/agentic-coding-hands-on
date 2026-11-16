import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { addHeartAction } from "@/features/kudos-hearts/server/kudo-heart-actions";
import { KudoHeartService } from "@/features/kudos-hearts/server/kudo-heart-service";
import { closeAppDb, signInToJar } from "../auth/auth-test-users";
import { requestCookies } from "../auth/next-request-stub";
import { openWriting } from "../kudos-authoring/event-end-override";
import { cleanupSunners, createSunner, type Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import * as hearts from "./kudo-heart-fixtures";

vi.mock("next/headers", async () => (await import("../auth/next-request-stub")).nextHeadersMock);
vi.mock("next/server", async (original) =>
  (await import("../auth/next-request-stub")).withRequestScopedConnection(await original<object>()),
);
vi.mock("@/shared/config/env", async (original) =>
  (await import("../kudos-authoring/event-end-override")).withEventEndOverride(await original<{ env: object }>()),
);

/** SC-001 / FR-403 / BR-001: concurrent clicks, tabs and devices never duplicate a heart or its event. */
let sender: Sunner;
let fans: Sunner[];
let kudoId: string;

beforeAll(async () => {
  [sender, ...fans] = await Promise.all(
    ["race-sender", "race-fan-a", "race-fan-b", "race-fan-c"].map((prefix) => createSunner(prefix, prefix)),
  );
  kudoId = await insertKudo({ sender, recipient: fans[0] });
});
beforeEach(async () => {
  openWriting();
  requestCookies.clear();
  await hearts.resetHearts([kudoId]);
});
afterAll(async () => {
  await cleanupSunners([sender, ...fans]);
  await closeAppDb();
});

describe("heart concurrency", () => {
  it("20 parallel adds by one Sunner all succeed and leave exactly 1 row and 1 HeartAdded row", async () => {
    await signInToJar(requestCookies, fans[0].email);
    const results = await Promise.all(Array.from({ length: 20 }, () => addHeartAction(kudoId)));
    expect(results).toEqual(Array.from({ length: 20 }, () => ({ ok: true, heartCount: 1, heartedByMe: true })));
    expect(await hearts.heartRowsOf(kudoId)).toHaveLength(1);
    expect(await hearts.heartAddedRowsOf(kudoId)).toHaveLength(1);
  });

  it("three Sunners clicking five times each at once count exactly three hearts and three events", async () => {
    const outcomes = await Promise.all(fans.flatMap((fan) => Array.from({ length: 5 }, () => KudoHeartService.add(kudoId, fan.id))));
    expect(outcomes.filter((outcome) => outcome === "added")).toHaveLength(3);
    expect((await hearts.heartRowsOf(kudoId)).map((row) => row.user_id).sort()).toEqual(fans.map((fan) => fan.id).sort());
    expect(await hearts.heartAddedRowsOf(kudoId)).toHaveLength(3);
  });

  it("interleaved adds and removes by one Sunner never error and never leave more than one row", async () => {
    const fan = fans[1].id;
    const calls = Array.from({ length: 20 }, (_, index) =>
      index % 2 === 0 ? KudoHeartService.add(kudoId, fan) : KudoHeartService.remove(kudoId, fan),
    );
    await expect(Promise.all(calls)).resolves.toHaveLength(20);
    expect((await hearts.heartRowsOf(kudoId)).length).toBeLessThanOrEqual(1);
  });
});
