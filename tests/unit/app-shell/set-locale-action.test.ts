import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const set = vi.fn();
vi.mock("next/headers", () => ({ cookies: async () => ({ set }) }));

import { setLocaleAction } from "@/shared/i18n/set-locale-action";

describe("setLocaleAction", () => {
  beforeEach(() => set.mockReset());
  afterEach(() => vi.unstubAllEnvs());

  it("writes an httpOnly NEXT_LOCALE cookie for vi and en", async () => {
    await expect(setLocaleAction("en")).resolves.toEqual({ ok: true });
    expect(set).toHaveBeenCalledWith("NEXT_LOCALE", "en", {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secure: false,
    });
    await expect(setLocaleAction("vi")).resolves.toEqual({ ok: true });
    expect(set).toHaveBeenLastCalledWith("NEXT_LOCALE", "vi", expect.any(Object));
  });

  it("marks the cookie secure in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await expect(setLocaleAction("en")).resolves.toEqual({ ok: true });
    expect(set).toHaveBeenCalledWith("NEXT_LOCALE", "en", expect.objectContaining({ httpOnly: true, secure: true }));
  });

  it.each(["fr", "", "EN", null, undefined, 42, { locale: "en" }])(
    "rejects %j and leaves the cookie untouched",
    async (value) => {
      await expect(setLocaleAction(value)).resolves.toEqual({ ok: false });
      expect(set).not.toHaveBeenCalled();
    },
  );

  it("reports failure when the cookie cannot be written", async () => {
    set.mockImplementationOnce(() => {
      throw new Error("read-only cookies");
    });
    await expect(setLocaleAction("en")).resolves.toEqual({ ok: false });
  });
});
