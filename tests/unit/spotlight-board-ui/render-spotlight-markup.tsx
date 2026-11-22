import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

/**
 * Static HTML of a Spotlight Board component under the real `vi` (default) or `en` messages, for the
 * Node unit project (no DOM, so effects never run: no channel, no ResizeObserver). Test files stay
 * `.test.ts` (the project glob) and build the element with `createElement`.
 */
export function renderSpotlightMarkup(element: ReactElement, locale: "vi" | "en" = "vi"): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={locale === "vi" ? vi : en} timeZone="Asia/Ho_Chi_Minh">
      {element}
    </NextIntlClientProvider>,
  );
}

/** Visible text of the markup (tags dropped, whitespace, incl. the narrow no-break space, collapsed). */
export const textOf = (markup: string): string => markup.replace(/<[^>]+>/g, " ").replace(/\s+/gu, " ").trim();
