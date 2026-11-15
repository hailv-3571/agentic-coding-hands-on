import type { ReactNode } from "react";
import { AdminTopBar } from "@/features/app-shell/components/admin-top-bar";
import { AppFooter } from "@/features/app-shell/components/app-footer";
import { getShellSignOutAction, requireShellAdmin } from "@/features/app-shell/server/shell-session";

// Guards read the session per request (cookies + DB), so this frame is a blocking route like the root layout.
export const instant = false;

/** Admin frame. The guard runs first so no admin markup is produced for non-admins (FR-602). */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireShellAdmin();
  return (
    <>
      <AdminTopBar user={user} signOutAction={getShellSignOutAction()} />
      <div className="mx-auto flex w-full max-w-360 flex-1 flex-col px-4 py-8 md:px-12 xl:px-36">{children}</div>
      <AppFooter variant="minimal" />
    </>
  );
}
