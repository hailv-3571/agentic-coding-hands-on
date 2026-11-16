"use client";

import { useId, useRef, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ComposerIcon } from "./composer-icon";
import { panelSurface, primaryButton, secondaryButton } from "./composer-styles";
import { useFocusTrap } from "./use-focus-trap";

type DiscardChangesConfirmProps = {
  onKeepEditing(): void;
  onDiscard(): void;
};

/**
 * Asked when Esc / "Hủy" would close a dirty composer (screen spec § 4 "Hủy khi đã nhập dở").
 * An alertdialog over the composer; the safe choice ("Tiếp tục soạn") has focus, Esc keeps editing.
 */
export function DiscardChangesConfirm({ onKeepEditing, onDiscard }: DiscardChangesConfirmProps) {
  const t = useTranslations("kudosComposer.confirmDiscard");
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useFocusTrap(panelRef, true);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    onKeepEditing();
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-background/80 p-4">
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`flex w-full max-w-120 flex-col gap-6 rounded-3xl p-6 md:p-10 ${panelSurface}`}
      >
        <h2 id={titleId} className="text-headline-small font-bold">
          {t("title")}
        </h2>
        <p id={descriptionId} className="text-title-medium font-bold text-text-muted">
          {t("description")}
        </p>
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-6">
          <button type="button" onClick={onDiscard} className={secondaryButton}>
            {t("discard")}
            <ComposerIcon name="close" />
          </button>
          <button type="button" data-autofocus onClick={onKeepEditing} className={primaryButton}>
            {t("keep")}
          </button>
        </div>
      </div>
    </div>
  );
}
