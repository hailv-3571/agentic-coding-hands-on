import { useTranslations } from "next-intl";
import { settingsTitle } from "./campaign-settings-styles";

/** Loading state of Admin › Settings (spec § 5 "loading"): the title, then a header bar and three pulsing rows. */
export function CampaignSettingsSkeleton() {
  const t = useTranslations("adminCampaigns");
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className={settingsTitle}>{t("title")}</h1>
        <div className="h-13 w-40 animate-pulse rounded bg-secondary" />
      </div>
      <div className="flex flex-col">
        <div className="h-11 border-b border-divider bg-background" />
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex h-11 items-center border-b border-divider bg-container-2 px-3">
            <div className="h-4 w-full animate-pulse rounded bg-divider" />
          </div>
        ))}
      </div>
    </div>
  );
}
