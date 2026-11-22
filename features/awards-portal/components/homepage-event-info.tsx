import { getTranslations } from "next-intl/server";
import { toAdminZone } from "@/shared/admin/timezone";

const pad = (value: number) => String(value).padStart(2, "0");

/** `dd/MM/yyyy` of the ceremony in the single event zone (ADMIN_TIMEZONE, Asia/Ho_Chi_Minh — C-14). */
function formatEventDate(eventAtMs: number): string {
  const day = toAdminZone(new Date(eventAtMs));
  return `${pad(day.day)}/${pad(day.month)}/${day.year}`;
}

/**
 * Event info under the Homepage countdown (w 637, gap 8): "Thời gian:" + date from EVENT_AT and
 * "Địa điểm:" + venue (label Bold 16/24 white, value Bold 24/32 gold, baseline aligned, gap 60),
 * then the livestream line (text only, D008).
 */
export async function HomepageEventInfo({ eventAtMs }: { eventAtMs: number }) {
  const t = await getTranslations("awardsPortal.home");
  const label = "text-title-medium font-bold text-text";
  const value = "text-headline-small font-bold text-primary";
  return (
    <div className="flex max-w-[637px] flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-15 gap-y-1">
        <p className="flex items-baseline gap-1">
          <span className={label}>{t("timeLabel")}</span>{" "}
          <time dateTime={new Date(eventAtMs).toISOString()} className={value}>
            {formatEventDate(eventAtMs)}
          </time>
        </p>
        <p className="flex items-baseline gap-1">
          <span className={label}>{t("venueLabel")}</span>{" "}
          <span className={value}>{t("venue")}</span>
        </p>
      </div>
      <p className="text-body-large font-bold text-text">{t("livestream")}</p>
    </div>
  );
}
