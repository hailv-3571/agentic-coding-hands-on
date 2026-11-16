"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ComposerIcon } from "./composer-icon";
import { focusRing } from "./composer-styles";
import { KudoComposerModal } from "./kudo-composer-modal";

type KudoComposerLauncherProps = {
  /** From `isKudoWritingOpen()` in a server component; false after EVENT_END_AT. */
  writingOpen: boolean;
};

/**
 * "Hôm nay, bạn muốn gửi lời cảm ơn và ghi nhận đến ai?" prompt (FR-101; Figma Live board
 * `mms_A.1_Button ghi nhận` 2940:13449: pill, h72, 1 px #998C5F border, secondary fill, white
 * pencil). Opens the composer in create mode; disabled with the closed notice once writing ends.
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
        className={`flex min-h-18 w-full items-center gap-5 rounded-full border border-border bg-secondary px-4 py-3 text-left text-title-medium font-bold text-text transition-colors hover:bg-secondary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-secondary ${focusRing}`}
      >
        <span className="flex size-6 shrink-0 items-center justify-center">
          <ComposerIcon name="pencil" />
        </span>
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
  return <div aria-hidden className="min-h-18 w-full rounded-full border border-border bg-secondary" />;
}
