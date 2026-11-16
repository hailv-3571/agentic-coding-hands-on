import type { Metadata } from "next";
import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CampaignSettingsPanel } from "@/features/admin-campaigns/components/campaign-settings-panel";
import { CampaignSettingsSkeleton } from "@/features/admin-campaigns/components/campaign-settings-skeleton";
import type { CampaignListItem } from "@/features/admin-campaigns/schemas/campaign-admin-result";
import { CampaignAdminQuery } from "@/features/admin-campaigns/server/campaign-admin-query";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminCampaigns");
  return { title: t("metaTitle") };
}

/**
 * A failed read becomes the E14 error state (null) instead of failing the page. `list()` calls
 * `requireAdmin()` itself; its 403 / login redirect is rethrown, never swallowed here.
 */
async function loadCampaigns(): Promise<CampaignListItem[] | null> {
  try {
    return await CampaignAdminQuery.list();
  } catch (error) {
    unstable_rethrow(error);
    console.error("[admin-campaigns] loading the campaigns failed", error);
    return null;
  }
}

/** Request-time part: the campaign rows (only the client-safe `CampaignListItem` DTO crosses over). */
async function CampaignSettingsContent() {
  return <CampaignSettingsPanel campaigns={await loadCampaigns()} />;
}

/**
 * Admin › Settings `/admin/settings` (F011; Figma 820:10492): the x2 heart campaigns. Admin-only
 * twice over: app/admin/layout.tsx runs `requireShellAdmin()` before any admin markup (like
 * /admin/overview), and the list query plus every campaign action call `requireAdmin()` again.
 * The rows stream in behind a skeleton.
 */
export default function AdminSettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4">
      <Suspense fallback={<CampaignSettingsSkeleton />}>
        <CampaignSettingsContent />
      </Suspense>
    </main>
  );
}
