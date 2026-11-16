import { getTranslations } from "next-intl/server";

// Placeholder until phase 07 (awards portal) owns the real homepage. The Kudo composer launcher
// lives on the Live board (`/kudos`) since phase 05; editing opens from the owner's card.
export default async function HomePage() {
  const t = await getTranslations("common");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-8 text-center md:p-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-display-small text-primary">{t("appName")}</h1>
        <p className="text-body-large text-text-muted">{t("comingSoon")}</p>
      </div>
    </main>
  );
}
