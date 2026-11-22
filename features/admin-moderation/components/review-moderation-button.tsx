"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { useTranslations } from "next-intl";
import { menuItem } from "@/features/admin-campaigns/components/campaign-settings-styles";
import { useDismissable } from "@/features/app-shell/hooks/use-dismissable";
import type { AdminKudoStatus } from "../schemas/admin-kudo-row";
import type { KudoModerationResult } from "../schemas/kudo-moderation-result";
import { markKudoSpam, unSpamKudo } from "../server/kudo-moderation-actions";
import { AdminModerationIcon } from "./admin-moderation-icon";
import { popoverPanel, rowActionButton, spinner } from "./review-content-styles";

type ReviewModerationButtonProps = {
  kudoId: string;
  shortId: string;
  status: AdminKudoStatus;
  onResult(kudoId: string, result: KudoModerationResult): void;
};

/**
 * Row action (E16/E17 + confirm E18, Figma 773:26295 / 773:26373; D004): "Mark Spam" on a public
 * row, "Un Spam" on a spam row. The button opens a one-item popover ("⚠ Mark Spam" / "↺ Un Spam",
 * gold glow); choosing the item is the confirmation, Esc / an outside click / Tab cancel and
 * return focus to the button. The popover opens to the button's left so the scrolling table never
 * clips it. The server action runs in a transition; the button stays locked with a spinner until
 * it answers (no double submit), then the screen patches the row from the returned status.
 */
export function ReviewModerationButton({ kudoId, shortId, status, onResult }: ReviewModerationButtonProps) {
  const t = useTranslations("adminModeration.moderation");
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, containerRef, triggerRef);

  const toSpam = status === "public";
  const action = toSpam ? t("markSpam") : t("unSpam");

  useEffect(() => {
    if (open) itemRef.current?.focus();
  }, [open]);

  function confirm() {
    close();
    triggerRef.current?.focus();
    startSaving(async () => {
      let result: KudoModerationResult;
      try {
        result = await (toSpam ? markKudoSpam(kudoId) : unSpamKudo(kudoId));
      } catch {
        result = { ok: false, code: "unexpected" };
      }
      // State updates after an await are not part of the transition unless wrapped again.
      startSaving(() => onResult(kudoId, result));
    });
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    flushSync(() => setOpen(false));
    triggerRef.current?.focus();
    if (event.shiftKey) event.preventDefault();
  }

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t("trigger", { action, id: shortId })}
        aria-disabled={saving || undefined}
        onClick={() => {
          if (!saving) setOpen((current) => !current);
        }}
        className={rowActionButton}
      >
        {saving && <span aria-hidden className={spinner} />}
        {action}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t("confirmMenu", { action, id: shortId })}
          onKeyDown={handleMenuKeyDown}
          className={popoverPanel}
        >
          <button
            ref={itemRef}
            type="button"
            role="menuitem"
            onClick={confirm}
            className={`${menuItem} bg-secondary whitespace-nowrap [text-shadow:var(--shadow-gold)]`}
          >
            <AdminModerationIcon name={toSpam ? "mark-spam" : "un-spam"} />
            {action}
          </button>
        </div>
      )}
    </div>
  );
}
