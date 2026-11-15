import type { ReactNode } from "react";
import type { ShellUser, SignOutAction } from "../types";
import { AccountMenu } from "./account-menu";
import { LanguageSwitcher } from "./language-switcher";

type HeaderActionsProps = {
  user: ShellUser | null;
  signOutAction?: SignOutAction;
  /** Notification bell; phase 13 passes its component here. Renders nothing until then. */
  bellSlot?: ReactNode;
};

/** Right-hand cluster shared by the Sunner header and the admin top bar. */
export function HeaderActions({ user, signOutAction, bellSlot }: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-2 md:gap-4">
      {bellSlot}
      <LanguageSwitcher />
      {user && <AccountMenu user={user} signOutAction={signOutAction} />}
    </div>
  );
}
