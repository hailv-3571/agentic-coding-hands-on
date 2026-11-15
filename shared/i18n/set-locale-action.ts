"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { localeCookieName, locales } from "./locales";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const setLocaleInputSchema = z.enum(locales);

export type SetLocaleResult = { ok: true } | { ok: false };

/**
 * C-18: language switching is a server action. Only `vi`/`en` are accepted; anything
 * else leaves the cookie untouched. Only the server reads the cookie (next-intl request
 * config), so it is `httpOnly`, `sameSite=lax`, and `secure` in production.
 */
export async function setLocaleAction(locale: unknown): Promise<SetLocaleResult> {
  const parsed = setLocaleInputSchema.safeParse(locale);
  if (!parsed.success) return { ok: false };
  try {
    (await cookies()).set(localeCookieName, parsed.data, {
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  } catch (error) {
    console.error("[i18n] saving the language cookie failed", error);
    return { ok: false };
  }
  return { ok: true };
}
