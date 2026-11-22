"use client";

import { useLocale, useTranslations } from "next-intl";
import { useHydrated } from "../hooks/use-hydrated";
import { TICKER_LINE_OPACITY } from "../lib/spotlight-ui-config";
import type { SpotlightTickerItem } from "../schemas/spotlight-views";

/** Browser-local time in the UI language: vi "20:30", en "08:30 PM"; a dash when unknown (E07). */
function tickerTime(iso: string, locale: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "–" : new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
}

/**
 * Live ticker (FR-204, D006): "{time} {name} đã nhận được một Kudos mới", newest at the bottom, older
 * lines fading 100/100/70/50/30 %. Recipient only, never a sender. A polite log for screen readers.
 * The time needs the browser's clock zone, so it renders after hydration.
 */
export function SpotlightTicker({ items }: { items: SpotlightTickerItem[] }) {
  const t = useTranslations("spotlight");
  const locale = useLocale();
  const hydrated = useHydrated();

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label={t("tickerLabel")}
      className="absolute right-14 bottom-4 left-4 z-10 md:right-auto md:bottom-11 md:left-12 md:max-w-[min(580px,58%)]"
    >
      <ol className="flex flex-col">
        {items.map((item, index) => (
          <li
            key={item.kudoId}
            style={{ opacity: TICKER_LINE_OPACITY[items.length - 1 - index] ?? 0 }}
            className="truncate text-[10px] leading-4 font-bold tracking-[0.1px] text-text md:text-title-small md:leading-5 md:font-bold"
          >
            {t.rich("tickerLine", {
              at: hydrated ? tickerTime(item.occurredAt, locale) : "",
              name: item.recipientName,
              time: (chunks) => (
                <time dateTime={item.occurredAt} className="text-text-muted">
                  {chunks}
                </time>
              ),
              who: (chunks) => <span className="text-[11px] md:text-title-medium md:leading-5 md:font-bold">{chunks}</span>,
            })}
          </li>
        ))}
      </ol>
    </div>
  );
}
