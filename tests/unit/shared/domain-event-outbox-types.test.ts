import { describe, expect, it } from "vitest";
import type { Db } from "@/shared/db/client";
import { DomainEventOutbox } from "@/shared/events/domain-event-outbox";

/**
 * Compile-time lock (checked by `npm run typecheck`): the outbox only accepts a business
 * transaction. If `add()` is ever loosened to take a plain `Db`, the `@ts-expect-error`
 * below becomes an "unused directive" error and CI fails.
 */
describe("DomainEventOutbox.add typing", () => {
  it("rejects a non-transaction db handle at compile time", () => {
    const db = {} as Db;
    const attempt = () =>
      // @ts-expect-error add() accepts only a DbTx, never the root Db
      DomainEventOutbox.add(db, "KudoCreated", {
        kudoId: "00000000-0000-4000-8000-000000000001",
      });
    expect(attempt).toBeTypeOf("function");
  });
});
