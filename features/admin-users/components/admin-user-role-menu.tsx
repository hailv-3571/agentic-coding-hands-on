"use client";

import { useCallback, useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { unstable_rethrow } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminCampaignIcon } from "@/features/admin-campaigns/components/admin-campaign-icon";
import { popoverPanel, spinner } from "@/features/admin-moderation/components/review-content-styles";
import { useDismissable } from "@/features/app-shell/hooks/use-dismissable";
import { roleErrorKey, roleMenuState, type RoleErrorKey } from "../lib/admin-user-role-menu-state";
import type { AdminUserRole, AdminUserRow, SetUserRoleResult } from "../schemas/admin-user-views";
import { setUserRoleAction } from "../server/set-user-role-action";
import { AdminUserRoleDialog } from "./admin-user-role-dialog";
import { hintTooltip, roleMenuItem, roleMenuItemDisabled, rowMenuTrigger } from "./admin-users-styles";

type AdminUserRoleMenuProps = {
  user: Pick<AdminUserRow, "id" | "name" | "email" | "envAdmin">;
  /** The role on screen (patched in place after a change). */
  role: AdminUserRole;
  actorId: string;
  onChanged(role: AdminUserRole): void;
};

/** A thrown action or a network failure counts as a failed save (403/redirect interrupts pass through). */
async function setRoleSafely(userId: string, role: AdminUserRole): Promise<SetUserRoleResult> {
  try {
    return await setUserRoleAction({ userId, role });
  } catch (error) {
    unstable_rethrow(error);
    console.warn("[admin-users] changing the role failed", error);
    return { ok: false, error: "UNEXPECTED" };
  }
}

/**
 * Row actions (E18–E20, DEC-001): the phase 06 "⋯" button (named "Thao tác cho {name}") opens a
 * one-item menu to its left, so the scrolling table never clips it: "Set as Admin" on a User row,
 * "Set as User" on an Admin row — disabled with a tooltip on an ADMIN_EMAILS admin, and no menu at
 * all on the actor's own row (the button stays, locked, with the reason). Choosing the item opens
 * the confirm dialog; the save runs in a transition and the button stays locked with a spinner
 * until the server answers. Keyboard: Enter/Space/↓ open with focus on the item, Esc closes back
 * onto the button, Tab closes and moves on, an outside click closes; the dialog returns focus here.
 */
export function AdminUserRoleMenu({ user, role, actorId, onChanged }: AdminUserRoleMenuProps) {
  const t = useTranslations("adminUsers.roleMenu");
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorKey, setErrorKey] = useState<RoleErrorKey | null>(null);
  const [saving, startSaving] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const hintId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismissable(open, close, containerRef, triggerRef);

  useEffect(() => {
    if (open) itemRef.current?.focus();
  }, [open]);

  const state = roleMenuState({ id: user.id, role, envAdmin: user.envAdmin }, actorId);
  const target: AdminUserRole = state.kind === "self" ? role : state.target;
  const lockedHint = state.kind === "self" ? t("selfLocked") : null;
  const triggerLocked = saving || lockedHint !== null;

  function choose() {
    if (state.kind === "env-locked") return;
    close();
    triggerRef.current?.focus();
    setErrorKey(null);
    setConfirming(true);
  }

  function confirm() {
    setErrorKey(null);
    startSaving(async () => {
      const result = await setRoleSafely(user.id, target);
      // State updates after an await are not part of the transition unless wrapped again.
      startSaving(() => {
        if (!result.ok) return setErrorKey(roleErrorKey(result.error));
        setConfirming(false);
        onChanged(result.role);
      });
    });
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowDown" || open || triggerLocked) return;
    event.preventDefault();
    setOpen(true);
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    // Unmount the menu first, so Tab continues from the button to the next control.
    flushSync(() => setOpen(false));
    triggerRef.current?.focus();
    if (event.shiftKey) event.preventDefault();
  }

  const label = target === "admin" ? t("setAdmin") : t("setUser");

  return (
    <div ref={containerRef} className="group relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup={lockedHint ? undefined : "menu"}
        aria-expanded={lockedHint ? undefined : open}
        aria-controls={open ? menuId : undefined}
        aria-label={t("trigger", { name: user.name })}
        aria-disabled={triggerLocked || undefined}
        aria-busy={saving || undefined}
        aria-describedby={lockedHint ? hintId : undefined}
        onClick={() => !triggerLocked && setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        className={rowMenuTrigger}
      >
        {saving ? <span aria-hidden className={spinner} /> : <AdminCampaignIcon name="more" className={lockedHint ? "opacity-40" : ""} />}
      </button>
      {lockedHint && (
        <span id={hintId} role="tooltip" className={hintTooltip}>
          {lockedHint}
        </span>
      )}
      {open && (
        <div id={menuId} role="menu" aria-label={user.name} onKeyDown={handleMenuKeyDown} className={popoverPanel}>
          {state.kind === "env-locked" ? (
            // The open menu holds focus, so the reason shows next to the item right away.
            <div role="none" className="relative">
              <button ref={itemRef} type="button" role="menuitem" aria-disabled="true" aria-describedby={hintId} className={roleMenuItemDisabled}>
                {label}
              </button>
              <span id={hintId} role="tooltip" className={hintTooltip}>
                {t("envLocked")}
              </span>
            </div>
          ) : (
            <button ref={itemRef} type="button" role="menuitem" onClick={choose} className={roleMenuItem}>
              {label}
            </button>
          )}
        </div>
      )}
      {confirming && (
        <AdminUserRoleDialog
          name={user.name}
          email={user.email}
          target={target}
          pending={saving}
          errorKey={errorKey}
          onConfirm={confirm}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
