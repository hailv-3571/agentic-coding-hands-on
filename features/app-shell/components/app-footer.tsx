import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { BrandLogo } from "./brand-logo";
import { focusRing } from "./shell-styles";

type AppFooterProps = {
  /** `minimal` is the admin variant: copyright line only. */
  variant?: "full" | "minimal";
};

const footerLink = `rounded px-4 py-3 text-title-medium font-bold text-text transition-colors hover:bg-secondary hover:text-primary ${focusRing}`;

/** Footer on every signed-in page: logo, four links, copyright (decision-log D006). */
export async function AppFooter({ variant = "full" }: AppFooterProps) {
  const t = await getTranslations("shell");
  // Figma: regular body text on mobile, bold title from md up.
  const copyright = (
    <p className="text-body-medium font-normal text-text md:text-title-medium md:font-bold">{t("footer.copyright")}</p>
  );

  if (variant === "minimal") {
    return <footer className="border-t border-divider px-4 py-6 text-center md:px-12">{copyright}</footer>;
  }

  const links = [
    { href: APP_ROUTES.home, label: t("nav.aboutSaa") },
    { href: APP_ROUTES.awards, label: t("nav.awardInfo") },
    { href: APP_ROUTES.kudos, label: t("nav.kudos") },
    { href: APP_ROUTES.communityStandards, label: t("nav.communityStandards") },
  ];

  return (
    <footer className="border-t border-divider bg-container-2">
      <div className="mx-auto flex max-w-360 flex-col items-center gap-6 px-4 py-10 md:px-12 lg:flex-row lg:justify-between xl:px-22">
        <Link href={APP_ROUTES.home} aria-label={t("brand")} className={`rounded ${focusRing}`}>
          <BrandLogo alt={t("brand")} className="h-14 w-auto" />
        </Link>
        <nav aria-label={t("nav.label")}>
          <ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 lg:gap-x-8">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {copyright}
      </div>
    </footer>
  );
}
