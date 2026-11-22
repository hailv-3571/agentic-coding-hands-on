"use client";

import { useTranslations } from "next-intl";
import type { AdminKudoFilterValues, AdminKudoPerson } from "../schemas/admin-kudo-row";
import { ReviewPersonFilter } from "./review-person-filter";
import { ReviewSearchInput } from "./review-search-input";
import { ReviewStatusFilter } from "./review-status-filter";
import { useExternalResetKey } from "./use-external-reset-key";

type ReviewFiltersProps = {
  /** The view on screen (optimistic while a filter change navigates). */
  view: AdminKudoFilterValues;
  selectedSender: AdminKudoPerson | null;
  selectedReceiver: AdminKudoPerson | null;
  onChange(patch: Partial<AdminKudoFilterValues>): void;
};

/** The person to show for a filter id: only when the page's name lookup matches that id. */
function personFor(id: string | null, person: AdminKudoPerson | null): AdminKudoPerson | null {
  return id && person?.id === id ? person : null;
}

/**
 * Filter bar (R2, Figma mms_C_Filter): Sender, Receiver, Status on the left, the content search on
 * the right (stacked on phones). Every change goes up as a patch; the screen turns it into the
 * URL with page 1 (FR-402). Fields that keep their own text remount only on outside changes.
 */
export function ReviewFilters({ view, selectedSender, selectedReceiver, onChange }: ReviewFiltersProps) {
  const t = useTranslations("adminModeration.filters");
  const [senderKey, markSenderSent] = useExternalResetKey(view.senderId);
  const [receiverKey, markReceiverSent] = useExternalResetKey(view.receiverId);
  const [searchKey, markSearchSent] = useExternalResetKey(view.query);

  return (
    <div role="search" aria-label={t("region")} className="flex flex-wrap items-end justify-end gap-4">
      <div className="mr-auto flex w-full flex-col gap-4 sm:flex-row sm:flex-wrap md:w-auto">
        <ReviewPersonFilter
          key={`sender-${senderKey}`}
          label={t("sender")}
          placeholder={t("senderPlaceholder")}
          person={personFor(view.senderId, selectedSender)}
          onPick={(senderId) => {
            markSenderSent(senderId);
            onChange({ senderId });
          }}
        />
        <ReviewPersonFilter
          key={`receiver-${receiverKey}`}
          label={t("receiver")}
          placeholder={t("receiverPlaceholder")}
          person={personFor(view.receiverId, selectedReceiver)}
          onPick={(receiverId) => {
            markReceiverSent(receiverId);
            onChange({ receiverId });
          }}
        />
        <ReviewStatusFilter value={view.status} onChange={(status) => onChange({ status })} />
      </div>
      <ReviewSearchInput
        key={`search-${searchKey}`}
        initial={view.query}
        onSearch={(query) => {
          markSearchSent(query);
          onChange({ query });
        }}
      />
    </div>
  );
}
