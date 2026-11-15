import { getTranslations } from "next-intl/server";
import { ErrorPanel } from "@/features/app-shell/components/error-panel";
import { getShellUser } from "@/features/app-shell/server/shell-session";
import { APP_ROUTES } from "@/shared/ui/app-routes";

/** Rendered with status 404. Signed-in users get a Home button, guests a Login button (D005). */
export default async function NotFound() {
  const t = await getTranslations("errors.notFound");
  const user = await getShellUser();
  const cta = user
    ? { href: APP_ROUTES.home, label: t("ctaHome") }
    : { href: APP_ROUTES.login, label: t("ctaLogin") };

  return (
    <ErrorPanel
      title={t("title")}
      description={t("description")}
      illustration={{ src: "/images/shell/error-404-illustration.webp", width: 1100, height: 721 }}
      illustrationClassName="w-80 md:w-166"
      cta={cta}
    />
  );
}
