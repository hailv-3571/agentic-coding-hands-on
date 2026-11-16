"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { focusRing } from "@/features/app-shell/components/shell-styles";
import { useDismissable } from "@/features/app-shell/hooks/use-dismissable";
import { AdminCampaignIcon } from "./admin-campaign-icon";
import { menuItem } from "./campaign-settings-styles";

type CampaignRowMenuProps = {
  campaignName: string;
  onEdit(): void;
  onDelete(): void;
};

const itemsIn = (menu: HTMLElement | null) => [...(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];

/**
 * Row actions (E07–E09, Figma 820:11429): the 40 px "⋯" button (named "Thao tác {name}") opens a
 * menu with Edit and Delete — rendered only for upcoming and active rows (DEC-001; an ended row has
 * no button). Popover #00070C, 1 px gold border, rounded 8, p6, right-aligned under the button.
 * Keyboard: Enter/Space/↓ open it with focus on the first item, ↑/↓/Home/End move, Esc closes it
 * back onto the button, Tab closes it and moves on; an outside click closes it. Choosing an item
 * puts focus back on the button first, so the dialog it opens returns focus there.
 */
export function CampaignRowMenu({ campaignName, onEdit, onDelete }: CampaignRowMenuProps) {
  const t = useTranslations("adminCampaigns.menu");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, containerRef, triggerRef);

  useEffect(() => {
    if (open) itemsIn(menuRef.current)[0]?.focus();
  }, [open]);

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowDown" || open) return;
    event.preventDefault();
    setOpen(true);
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = itemsIn(menuRef.current);
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Tab") {
      // Tab moves on from the button: focus it before the focused item unmounts.
      triggerRef.current?.focus();
      return close();
    }
    let next: HTMLElement | undefined;
    if (event.key === "ArrowDown") next = items[(index + 1) % items.length];
    else if (event.key === "ArrowUp") next = items[(index - 1 + items.length) % items.length];
    else if (event.key === "Home") next = items[0];
    else if (event.key === "End") next = items[items.length - 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
  }

  function choose(action: () => void) {
    close();
    triggerRef.current?.focus();
    action();
  }

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t("trigger", { name: campaignName })}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleTriggerKeyDown}
        className={`flex size-10 items-center justify-center rounded transition-colors hover:bg-secondary ${focusRing}`}
      >
        <AdminCampaignIcon name="more" />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={campaignName}
          onKeyDown={handleMenuKeyDown}
          className="absolute top-full right-0 z-20 mt-1 flex flex-col rounded-lg border border-border bg-container-2 p-1.5"
        >
          <button type="button" role="menuitem" tabIndex={-1} onClick={() => choose(onEdit)} className={menuItem}>
            <AdminCampaignIcon name="edit" />
            {t("edit")}
          </button>
          <button type="button" role="menuitem" tabIndex={-1} onClick={() => choose(onDelete)} className={menuItem}>
            <AdminCampaignIcon name="delete-x" />
            {t("delete")}
          </button>
        </div>
      )}
    </div>
  );
}
