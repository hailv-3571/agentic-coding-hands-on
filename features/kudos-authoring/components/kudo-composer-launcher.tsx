"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { focusRing } from "./composer-styles";
import { KudoComposerModal } from "./kudo-composer-modal";

/** Figma pill 2940:13449: h72, rounded 68, secondary fill, 1 px #998C5F border, px16. */
const pill = "min-h-18 w-full rounded-[68px] border border-border bg-secondary";

type KudoComposerLauncherProps = {
  /** From `isKudoWritingOpen()` in a server component; false after EVENT_END_AT. */
  writingOpen: boolean;
};

/**
 * "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" prompt (FR-101) on the Live board
 * (Figma `mms_A.1_Button ghi nhận` 2940:13449: w738 pill, ic-pen-light 24 + gap 16, Bold 16/24
 * white, tracking .15). Opens the composer in create mode; disabled with the closed notice once
 * writing ends.
 */
export function KudoComposerLauncher({ writingOpen }: KudoComposerLauncherProps) {
  const t = useTranslations("kudosComposer");
  const [open, setOpen] = useState(false);
  const noticeId = useId();

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        disabled={!writingOpen}
        aria-describedby={writingOpen ? undefined : noticeId}
        onClick={() => setOpen(true)}
        className={`${pill} flex items-center gap-4 px-4 py-3 text-left text-title-medium font-bold text-text transition-colors hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-secondary ${focusRing}`}
      >
        <Image src="/images/kudos-feed/ic-pen-light.svg" width={24} height={24} alt="" aria-hidden draggable={false} className="shrink-0" />
        {t("launcher.prompt")}
      </button>
      {!writingOpen && (
        <p id={noticeId} className="px-4 text-left text-title-small font-bold text-text-muted">
          {t("errors.WRITING_CLOSED")}
        </p>
      )}
      <KudoComposerModal mode="create" open={open} onOpenChange={setOpen} />
    </div>
  );
}

/** Same-size stand-in while the writing window is read at request time (no layout shift). */
export function KudoComposerLauncherPlaceholder() {
  return <div aria-hidden className={pill} />;
}
