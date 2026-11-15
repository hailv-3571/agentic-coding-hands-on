import { getTranslations } from "next-intl/server";

// Placeholder until phase 14 (admin overview) owns the real page. Admin access is
// enforced by app/admin/layout.tsx (requireShellAdmin) before this renders.
export default async function AdminOverviewPage() {
  const t = await getTranslations("common");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-display-small text-primary">{t("appName")}</h1>
      <p className="text-body-large text-text-muted">{t("comingSoon")}</p>
    </main>
  );
}
