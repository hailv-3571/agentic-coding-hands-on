import type { ReactNode } from "react";
import { AppFooter } from "@/features/app-shell/components/app-footer";
import { AppHeader } from "@/features/app-shell/components/app-header";
import { getShellSignOutAction, getShellUser } from "@/features/app-shell/server/shell-session";
import { requireSunner } from "@/shared/auth/current-user";

// Guards read the session per request (cookies + DB), so this frame is a blocking route like the root layout.
export const instant = false;

/** Sunner area frame: header, page content, footer. Guests and users without a department are redirected first. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSunner();
  const user = await getShellUser();
  return (
    <>
      <AppHeader user={user} signOutAction={getShellSignOutAction()} />
      <div className="flex flex-1 flex-col">{children}</div>
      <AppFooter />
    </>
  );
}
