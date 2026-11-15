"use client";

import { useCallback, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ADMIN_ROUTES, APP_ROUTES } from "@/shared/ui/app-routes";
import { useDismissable } from "../hooks/use-dismissable";
import type { ShellUser, SignOutAction } from "../types";
import { ChevronRightIcon, DashboardGridIcon, PersonIcon } from "./shell-icons";
import { dropdownItem, dropdownPanel, focusRing } from "./shell-styles";
import { UserAvatar } from "./user-avatar";

type AccountMenuProps = {
  user: ShellUser;
  /** Phase 02's sign-out server action; the Logout row is hidden without it. */
  signOutAction?: SignOutAction;
};

/** Avatar button opening Profile, Dashboard (admins only, cosmetic: BR-002) and Logout. */
export function AccountMenu({ user, signOutAction }: AccountMenuProps) {
  const t = useTranslations("shell.account");
  const [open, setOpen] = useState(false);
  const [logoutFailed, setLogoutFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);

  useDismissable(open, close, containerRef, triggerRef);

  function logout() {
    if (!signOutAction) return;
    setLogoutFailed(false);
    startTransition(async () => {
      try {
        const result = await signOutAction();
        if (result && !result.ok) setLogoutFailed(true);
      } catch {
        setLogoutFailed(true);
      }
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${t("open")}: ${user.name}`}
        title={user.name}
        onClick={() => setOpen((value) => !value)}
        className={`size-10 overflow-hidden rounded border border-border bg-container text-text transition-colors hover:bg-secondary ${focusRing}`}
      >
        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} />
      </button>
      {open && (
        <div id={panelId} className={`${dropdownPanel} right-0 min-w-48`}>
          <Link href={APP_ROUTES.profile} onClick={close} className={dropdownItem}>
            {t("profile")}
            <PersonIcon />
          </Link>
          {user.isAdmin && (
            <Link href={ADMIN_ROUTES.overview} onClick={close} className={dropdownItem}>
              {t("dashboard")}
              <DashboardGridIcon />
            </Link>
          )}
          {signOutAction && (
            <button type="button" disabled={pending} onClick={logout} className={`${dropdownItem} disabled:opacity-60`}>
              {t("logout")}
              <ChevronRightIcon />
            </button>
          )}
          {logoutFailed && (
            <p role="alert" className="px-4 pb-2 text-body-medium text-error">
              {t("logoutFailed")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
