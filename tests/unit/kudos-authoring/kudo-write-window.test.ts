import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const connection = vi.hoisted(() => vi.fn(async () => undefined));
vi.mock("@/shared/config/env", () => ({ env: { EVENT_END_AT: Date.parse("2026-12-31T16:59:59.000Z") } }));
vi.mock("next/server", () => ({ connection }));

const { isKudoWritingOpen } = await import("@/features/kudos-authoring/server/kudo-write-window");

/** Flag a server component passes to the composer launcher (closed from EVENT_END_AT). */
describe("isKudoWritingOpen", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["Date"] }));
  afterEach(() => vi.useRealTimers());

  it("is open before EVENT_END_AT and opts the render out of prerendering first", async () => {
    vi.setSystemTime(new Date("2026-12-31T16:59:58.999Z"));
    expect(await isKudoWritingOpen()).toBe(true);
    expect(connection).toHaveBeenCalled();
  });

  it("is closed from EVENT_END_AT on", async () => {
    vi.setSystemTime(new Date("2026-12-31T16:59:59.000Z"));
    expect(await isKudoWritingOpen()).toBe(false);
  });
});
