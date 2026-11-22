import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { IDEMPOTENCY_KEY_HEADER, parseIdempotencyKey } from "@/features/secret-box-rewards/schemas/open-secret-box-schemas";

/** POST /api/secret-boxes/open header contract (FR-402): `Idempotency-Key` must be a UUID v4. */
describe("parseIdempotencyKey", () => {
  it("accepts a UUID v4 (crypto.randomUUID) and normalises it to lower case", () => {
    const key = randomUUID();
    expect(parseIdempotencyKey(key)).toBe(key);
    expect(parseIdempotencyKey(key.toUpperCase())).toBe(key);
  });

  it.each([
    ["missing", null],
    ["empty", ""],
    ["not a uuid", "open-my-box"],
    ["uuid v1", "6f1c2b9e-3d4a-1e5f-9a8b-7c6d5e4f3a2b"],
    ["uuid v7", "01890a5d-ac96-774b-bcce-b302099a8057"],
    ["uuid with spaces", ` ${randomUUID()} `],
    ["nil uuid", "00000000-0000-0000-0000-000000000000"],
  ])("rejects a %s key", (_label, value) => {
    expect(parseIdempotencyKey(value)).toBeNull();
  });

  it("names the header the client sends", () => {
    expect(IDEMPOTENCY_KEY_HEADER).toBe("Idempotency-Key");
  });
});
