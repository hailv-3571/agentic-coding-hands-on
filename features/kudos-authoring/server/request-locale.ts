import "server-only";
import type { NextRequest } from "next/server";
import { localeCookieName, type Locale } from "@/shared/i18n/locales";
import { resolveLocale } from "@/shared/i18n/resolve-locale";

/** UI locale of a route-handler request: NEXT_LOCALE cookie, then Accept-Language, then vi (BR-001). */
export function requestLocale(request: NextRequest): Locale {
  return resolveLocale({
    cookie: request.cookies.get(localeCookieName)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });
}
