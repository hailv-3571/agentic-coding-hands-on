import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { SecretBoxGrantService } from "@/features/secret-box-rewards/server/secret-box-grant-service";
import { SecretBoxSweepJob } from "@/features/secret-box-rewards/server/secret-box-sweep-job";
import { closeAppDb } from "../auth/auth-test-users";
import type { Sunner } from "../kudos-authoring/kudo-test-fixtures";
import { insertKudo } from "../kudos-feed/kudo-feed-fixtures";
import { insertHeart } from "../kudos-hearts/kudo-heart-fixtures";
import { boxesOf, cleanupSecretBoxUsers, createSunners, eventsFor, resetRewards } from "./secret-box-fixtures";
import { resetSecretBoxEnv } from "./secret-box-env-override";

vi.mock("@/shared/config/env", async (original) => (await import("./secret-box-env-override")).withSecretBoxEnv(await original()));

/**
 * Grant never over-issues (plan success criterion 1, ALG-001, BR-001): 20 parallel reconciles — read
 * path and sweep tick mixed — over a weighted total of 23 (5 hearts per box) insert exactly seq 1..4
 * and exactly one `BoxGranted{count: 4}`; a rerun inserts nothing and emits nothing.
 */
let sender: Sunner;
let fans: Sunner[];

beforeAll(async () => {
  [sender, ...fans] = await createSunners(["sbx-conc-sender", "sbx-conc-a", "sbx-conc-b", "sbx-conc-c"]);
  // 4 kudos × 3 fans = 12 hearts: 11 at x2 + 1 at x1 = weighted 23 (raw 12).
  let pairs = 0;
  for (let index = 0; index < 4; index += 1) {
    const kudoId = await insertKudo({ sender, recipient: fans[0] });
    for (const fan of fans) {
      pairs += 1;
      await insertHeart(kudoId, fan.id, pairs === 12 ? 1 : 2);
    }
  }
});
beforeEach(async () => {
  resetSecretBoxEnv();
  await resetRewards([sender.id]);
});
afterAll(async () => {
  await cleanupSecretBoxUsers([sender, ...fans]);
  await closeAppDb();
});

describe("SecretBoxGrantService.reconcileForSender under concurrency", () => {
  it("grants exactly 4 boxes and one BoxGranted{count: 4} for 20 parallel read-path and sweep reconciles", async () => {
    const runs = Array.from({ length: 20 }, (_, index) =>
      index % 2 === 0 ? SecretBoxGrantService.reconcileForSender(sender.id).then((result) => result.granted) : SecretBoxSweepJob.run().then(() => null),
    );
    const granted = (await Promise.all(runs)).filter((value): value is number => value !== null);

    expect(await boxesOf(sender.id)).toEqual([1, 2, 3, 4].map((seq) => ({ seq, status: "unopened" })));
    expect(await eventsFor("BoxGranted", sender.id)).toEqual([{ userId: sender.id, count: 4 }]);
    expect(granted.reduce((sum, value) => sum + value, 0)).toBeLessThanOrEqual(4);
  });

  it("inserts nothing and emits nothing on a rerun", async () => {
    await SecretBoxGrantService.reconcileForSender(sender.id);
    const rerun = await SecretBoxGrantService.reconcileForSender(sender.id);
    expect(rerun).toEqual({ granted: 0, stats: { weightedTotal: 23, rawTotal: 12, campaignActive: false } });
    expect(await boxesOf(sender.id)).toHaveLength(4);
    expect(await eventsFor("BoxGranted", sender.id)).toHaveLength(1);
  });
});
