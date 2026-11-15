import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import type { NavItem, ShellUser, SignOutAction } from "../types";
import { NavLinks } from "./app-header-nav-links";
import { BrandLogo } from "./brand-logo";
import { HeaderActions } from "./header-actions";
import { MobileNavMenu } from "./mobile-nav-menu";
import { focusRing, headerBar } from "./shell-styles";

type AppHeaderProps = {
  user: ShellUser | null;
  signOutAction?: SignOutAction;
  bellSlot?: ReactNode;
};

/** Sunner header: logo, three main links (collapsed below `md`), bell slot, language, account. */
export async function AppHeader({ user, signOutAction, bellSlot }: AppHeaderProps) {
  const t = await getTranslations("shell");
  const items: NavItem[] = [
    { href: APP_ROUTES.home, label: t("nav.aboutSaa") },
    { href: APP_ROUTES.awards, label: t("nav.awardInfo") },
    { href: APP_ROUTES.kudos, label: t("nav.kudos") },
  ];

  return (
    <header className={headerBar}>
      <div className="mx-auto flex h-20 max-w-360 items-center justify-between gap-4 px-4 md:px-12 xl:px-36">
        <div className="flex items-center gap-2 md:gap-12">
          <MobileNavMenu items={items} navLabel={t("nav.label")} />
          <Link href={APP_ROUTES.home} aria-label={t("brand")} className={`rounded ${focusRing}`}>
            <BrandLogo alt={t("brand")} priority />
          </Link>
          <NavLinks items={items} label={t("nav.label")} className="hidden md:block" />
        </div>
        <HeaderActions user={user} signOutAction={signOutAction} bellSlot={bellSlot} />
      </div>
    </header>
  );
}
