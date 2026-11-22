"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { focusRing } from "@/features/app-shell/components/shell-styles";
import { KudoFeedIcon } from "@/features/kudos-feed/components/kudo-feed-icon";
import { LockedRecipientComposer } from "./locked-recipient-composer";

type ProfileSendKudoButtonProps = {
  recipient: { id: string; fullName: string };
  /** From `isKudoWritingOpen()`: false from EVENT_END_AT, like the Live board launcher. */
  writingOpen: boolean;
};

/**
 * "Gửi lời cảm ơn và ghi nhận tới {tên}" on another Sunner's profile (FR-304, Figma 362:5133): a
 * 680×72 pill (secondary fill, 1 px #998C5F, radius 68, pen 24 + gap 16, Bold 16/24 white) that opens
 * the composer with this person prefilled and locked (D008). Disabled with the closed notice once
 * writing ends. Closing the composer leaves the profile as it was (US005 error path).
 */
export function ProfileSendKudoButton({ recipient, writingOpen }: ProfileSendKudoButtonProps) {
  const t = useTranslations("profile");
  const composer = useTranslations("kudosComposer");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const noticeId = useId();

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        disabled={!writingOpen}
        aria-describedby={writingOpen ? undefined : noticeId}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className={`flex min-h-18 w-full items-center justify-center gap-4 rounded-[68px] border border-border bg-secondary px-4 py-6 text-center text-title-medium font-bold text-text transition-colors hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-secondary ${focusRing}`}
      >
        <KudoFeedIcon name="pen-light" />
        {t("sendKudo", { name: recipient.fullName })}
      </button>
      {!writingOpen && (
        <p id={noticeId} className="px-4 text-center text-title-small font-bold text-text-muted">
          {composer("errors.WRITING_CLOSED")}
        </p>
      )}
      {mounted && <LockedRecipientComposer recipient={recipient} open={open} onOpenChange={setOpen} />}
    </div>
  );
}
