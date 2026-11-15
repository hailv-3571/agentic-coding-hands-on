import { getTranslations } from "next-intl/server";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { ErrorPanel } from "./error-panel";

/**
 * 403 Access Denied content (Figma 2182:9291). One source for app/forbidden.tsx (guards'
 * `forbidden()`) and app/access-denied (the body of the proxy's HTTP 403), so both read the same.
 */
export async function ForbiddenPanel() {
  const t = await getTranslations("errors.forbidden");
  return (
    <ErrorPanel
      title={t("title")}
      description={t("description")}
      illustration={{ src: "/images/shell/error-403-illustration.webp", width: 860, height: 859 }}
      illustrationClassName="w-72 md:w-107"
      cta={{ href: APP_ROUTES.home, label: t("cta") }}
    />
  );
}
