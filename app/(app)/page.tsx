import { getTranslations } from "next-intl/server";

// Placeholder until phase 07 (awards portal) owns the real homepage.
export default async function HomePage() {
  const t = await getTranslations("common");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-display-small text-primary">{t("appName")}</h1>
      <p className="text-body-large text-text-muted">{t("comingSoon")}</p>
    </main>
  );
}
