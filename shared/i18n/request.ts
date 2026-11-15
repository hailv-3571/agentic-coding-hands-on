import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { localeCookieName, type Locale } from "./locales";
import { resolveLocale } from "./resolve-locale";

const messageLoaders: Record<Locale, () => Promise<{ default: Record<string, unknown> }>> = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
};

/** next-intl request config (wired in next.config.ts): cookie, then Accept-Language, then `vi` (BR-001). */
export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale({
    cookie: cookieStore.get(localeCookieName)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });
  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
  };
});
