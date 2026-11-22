import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RulesPanel } from "@/features/awards-portal/components/rules-panel";
import { LiveBoardKeyvisualBackground } from "@/features/kudos-feed/components/live-board-keyvisual";
import { requireSunner } from "@/shared/auth/current-user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("awardsPortal.rules");
  return { title: t("metaTitle") };
}

/** Session check per request: a blocking route, like the other Sunner pages. */
export const instant = false;

/**
 * Thể lệ `/rules` (SCR-rules; Figma 3204:6051 drawn as its 553 px right panel, decision-log
 * 2026-11-17): the panel over the dimmed keyvisual, like the Kudo detail page.
 */
export default async function RulesPage() {
  await requireSunner();
  return (
    <main className="relative isolate -mt-20 flex flex-1 flex-col">
      <LiveBoardKeyvisualBackground dimmed />
      <div className="flex flex-1 justify-end pt-20">
        <RulesPanel />
      </div>
    </main>
  );
}
