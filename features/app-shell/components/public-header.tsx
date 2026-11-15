import { getTranslations } from "next-intl/server";
import { BrandLogo } from "./brand-logo";
import { LanguageSwitcher } from "./language-switcher";
import { headerBar } from "./shell-styles";

/** Header for signed-out pages (login, countdown): logo and language switcher only (D002). */
export async function PublicHeader() {
  const t = await getTranslations("shell");
  return (
    <header className={headerBar}>
      <div className="mx-auto flex h-20 max-w-360 items-center justify-between gap-4 px-4 md:px-12 xl:px-36">
        <BrandLogo alt={t("brand")} priority />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
