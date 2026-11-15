import type { ReactNode } from "react";
import { AppFooter } from "@/features/app-shell/components/app-footer";
import { PublicHeader } from "@/features/app-shell/components/public-header";

/** Signed-out pages (/login, /countdown): logo + language switcher, no navigation, copyright footer. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <AppFooter variant="minimal" />
    </>
  );
}
