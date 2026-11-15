import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "./locales";

const messageLoaders: Record<Locale, () => Promise<{ default: Record<string, unknown> }>> = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
};

/** next-intl request config (wired in next.config.ts): locale from the cookie, else `vi`. */
export default getRequestConfig(async () => {
  const cookieValue = (await cookies()).get(localeCookieName)?.value;
  const locale: Locale = isLocale(cookieValue) ? cookieValue : defaultLocale;
  return {
    locale,
    messages: (await messageLoaders[locale]()).default,
  };
});
