import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ADMIN_ROUTES, APP_ROUTES } from "@/shared/ui/app-routes";
import type { NavItem, ShellUser, SignOutAction } from "../types";
import { NavLinks } from "./app-header-nav-links";
import { BrandLogo } from "./brand-logo";
import { HeaderActions } from "./header-actions";
import { MobileNavMenu } from "./mobile-nav-menu";
import { focusRing } from "./shell-styles";

type AdminTopBarProps = {
  user: ShellUser;
  signOutAction?: SignOutAction;
  bellSlot?: ReactNode;
};

/** Admin top bar: logo + ADMIN (links back to the Sunner area), 4 menu items, language, account (FR-301..303). */
export async function AdminTopBar({ user, signOutAction, bellSlot }: AdminTopBarProps) {
  const t = await getTranslations("shell");
  const items: NavItem[] = [
    { href: ADMIN_ROUTES.overview, label: t("admin.overview") },
    { href: ADMIN_ROUTES.review, label: t("admin.review") },
    { href: ADMIN_ROUTES.users, label: t("admin.users") },
    { href: ADMIN_ROUTES.settings, label: t("admin.settings") },
  ];

  // Figma 620:7712: a lighter band than the Sunner header (fill #2c2f31, no Figma variable);
  // Details/Divider (#2e3940) is the nearest token. 88px tall, larger logo, rule before ADMIN.
  // LOGO ADMIN (I620:24395;620:8531): 4px gaps, 32px rule, ADMIN in Text/title/medium (16/24).
  return (
    <header className="sticky top-0 z-40 bg-divider/95 backdrop-blur">
      <div className="mx-auto flex h-22 max-w-360 items-center justify-between gap-4 px-4 md:px-12 xl:px-36">
        <div className="flex items-center gap-2 md:gap-8 lg:gap-12">
          <MobileNavMenu items={items} navLabel={t("admin.label")} />
          {/* Accessible name = logo alt + visible "ADMIN" + where it leads (label in name, WCAG 2.5.3). */}
          <Link href={APP_ROUTES.home} className={`flex items-center gap-1 rounded ${focusRing}`}>
            <BrandLogo alt={t("brand")} className="h-12 w-auto md:h-16" priority />
            <span aria-hidden className="h-8 w-px bg-text-muted" />
            <span className="text-title-medium text-primary">{t("admin.badge")}</span>
            <span className="sr-only">{t("admin.backToApp")}</span>
          </Link>
          <NavLinks items={items} label={t("admin.label")} className="hidden md:block" />
        </div>
        <HeaderActions user={user} signOutAction={signOutAction} bellSlot={bellSlot} />
      </div>
    </header>
  );
}
