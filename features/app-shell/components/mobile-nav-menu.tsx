"use client";

import { useCallback, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { NavItem } from "../types";
import { useDismissable } from "../hooks/use-dismissable";
import { NavLinks } from "./app-header-nav-links";
import { CloseIcon, MenuIcon } from "./shell-icons";
import { dropdownPanel, focusRing } from "./shell-styles";

type MobileNavMenuProps = {
  items: NavItem[];
  navLabel: string;
};

/** Collapsed navigation shown below the `md` breakpoint (FR-104): closes on select, outside click, Escape. */
export function MobileNavMenu({ items, navLabel }: MobileNavMenuProps) {
  const t = useTranslations("shell.mobileMenu");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);

  useDismissable(open, close, containerRef, triggerRef);

  return (
    <div ref={containerRef} className="relative md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t("close") : t("open")}
        onClick={() => setOpen((value) => !value)}
        className={`flex size-10 items-center justify-center rounded text-text hover:text-primary ${focusRing}`}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open && (
        <div id={panelId} className={`${dropdownPanel} left-0 min-w-56`}>
          <NavLinks items={items} label={navLabel} vertical onNavigate={close} />
        </div>
      )}
    </div>
  );
}
