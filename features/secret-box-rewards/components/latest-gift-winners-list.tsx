import { useId } from "react";
import { useTranslations } from "next-intl";
import { UserAvatar } from "@/features/app-shell/components/user-avatar";
import type { GiftWinnerView } from "../schemas/secret-box-views";
import { RewardsStatusMessage } from "./rewards-status-message";
import { focusRing, rewardsPanel, thinScrollbar } from "./secret-box-styles";

/**
 * "10 SUNNER NHẬN QUÀ MỚI NHẤT" (CAP-05; Figma 2940:13510): panel pl24 pr16 py24, gold title on two
 * lines, then up to 10 gift winners newest first (gifts only, FR-205): 64 px avatar (initial when
 * there is no photo), name Bold 22/28 gold, "Nhận được {giftName}" Bold 16/24 white. About five
 * rows show; the rest scroll behind a 2 px #999 thumb. The list is focusable so it scrolls from the
 * keyboard. Empty → "Chưa có Sunner nào nhận quà." (FR-206); `winners = null` → error with retry.
 * Server/client neutral.
 */
export function LatestGiftWinnersList({ winners }: { winners: GiftWinnerView[] | null }) {
  const t = useTranslations("secretBox.winners");
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={`${rewardsPanel} flex flex-col gap-4 py-6 pr-4 pl-6`}>
      {/* max-w keeps the Figma break: "10 SUNNER NHẬN QUÀ / MỚI NHẤT". */}
      <h3 id={titleId} className="mx-auto max-w-72 text-center text-title-large font-bold text-primary">
        {t("title")}
      </h3>
      {winners === null && <RewardsStatusMessage kind="error" message={t("loadFailed")} />}
      {winners?.length === 0 && <RewardsStatusMessage kind="empty" message={t("empty")} />}
      {winners && winners.length > 0 && (
        <ol aria-labelledby={titleId} tabIndex={0} className={`flex max-h-100 flex-col gap-4 overflow-y-auto rounded pr-2 ${thinScrollbar} ${focusRing}`}>
          {winners.map((winner, index) => (
            <li key={`${winner.userId}-${winner.openedAt}-${index}`} className="flex items-center gap-2">
              <span className="size-12 shrink-0 overflow-hidden rounded-full border border-text bg-secondary text-primary sm:size-16">
                <UserAvatar name={winner.name} avatarUrl={winner.avatarUrl} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-title-medium font-bold text-primary sm:text-title-large sm:font-bold" title={winner.name}>
                  {winner.name}
                </span>
                <span className="text-title-small font-bold text-text sm:text-title-medium sm:font-bold">{t("received", { giftName: winner.giftName })}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
