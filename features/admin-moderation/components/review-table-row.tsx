"use client";

import { useFormatter, useTranslations } from "next-intl";
import { bodyCell } from "@/features/admin-campaigns/components/campaign-settings-styles";
import type { AdminKudoPerson, AdminKudoRow, AdminKudoStatus } from "../schemas/admin-kudo-row";
import type { KudoModerationResult } from "../schemas/kudo-moderation-result";
import { kudoMessagePlainText } from "./kudo-message-plain-text";
import { anonymousChip, statusBadge } from "./review-content-styles";
import { ReviewModerationButton } from "./review-moderation-button";

type ReviewTableRowProps = {
  row: AdminKudoRow;
  /** The row's status on screen (patched in place after a moderation). */
  status: AdminKudoStatus;
  onModerated(kudoId: string, result: KudoModerationResult): void;
};

function PersonName({ person }: { person: AdminKudoPerson }) {
  return (
    <span className="block wrap-anywhere" title={person.email}>
      {person.name}
    </span>
  );
}

/** E15 badge: text carries the meaning, the border colour only repeats it. */
export function ReviewStatusBadge({ status }: { status: AdminKudoStatus }) {
  const t = useTranslations("adminModeration.status");
  return <span className={`${statusBadge.base} ${statusBadge[status]}`}>{t(status)}</span>;
}

/**
 * One Kudo row (Figma mms_D.2_Data): short id (D011) · real sender, with the "Ẩn danh" chip when the
 * Kudo was sent anonymously (D001, admin-only DTO) · receiver · bold title over the message as
 * plain text clamped to 4 lines (Markdown markers stripped, never rendered as HTML) · hashtags one
 * per line, each cut with an ellipsis · raw heart count with the locale's thousands separator
 * (D010) · status badge · Mark Spam / Un Spam. Empty cells show a dash.
 */
export function ReviewTableRow({ row, status, onModerated }: ReviewTableRowProps) {
  const t = useTranslations("adminModeration.table");
  const format = useFormatter();
  const message = kudoMessagePlainText(row.message);

  return (
    <tr>
      <td className={`${bodyCell} tabular-nums`}>{row.shortId}</td>
      <td className={bodyCell}>
        <PersonName person={row.sender} />
        {row.isAnonymous && (
          <span
            className={`${anonymousChip} mt-1`}
            title={row.anonymousNickname ? t("anonymousNickname", { nickname: row.anonymousNickname }) : undefined}
          >
            {t("anonymous")}
          </span>
        )}
      </td>
      <td className={bodyCell}>
        <PersonName person={row.receiver} />
      </td>
      <td className={bodyCell}>
        {row.title && <p className="font-bold wrap-anywhere uppercase">{row.title}</p>}
        <p className="line-clamp-4 wrap-anywhere">{message || "—"}</p>
      </td>
      <td className={bodyCell}>
        {row.hashtags.length === 0 ? (
          "—"
        ) : (
          <ul className="flex flex-col">
            {row.hashtags.map((tag) => (
              <li key={tag} title={tag} className="truncate py-1 text-[12px] leading-4 font-medium tracking-[0.5px]">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className={`${bodyCell} tabular-nums`}>{format.number(row.heartCount)}</td>
      <td className={bodyCell}>
        <ReviewStatusBadge status={status} />
      </td>
      <td className={bodyCell}>
        <ReviewModerationButton kudoId={row.id} shortId={row.shortId} status={status} onResult={onModerated} />
      </td>
    </tr>
  );
}
