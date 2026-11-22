import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CommunityStandardsContent } from "@/features/awards-portal/components/community-standards-content";
import { portalColumn } from "@/features/awards-portal/components/portal-styles";
import { LiveBoardKeyvisualBackground } from "@/features/kudos-feed/components/live-board-keyvisual";
import { requireSunner } from "@/shared/auth/current-user";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("awardsPortal.standards");
  return { title: t("metaTitle") };
}

/** Session check per request: a blocking route, like the other Sunner pages. */
export const instant = false;

/**
 * Tiêu chuẩn cộng đồng (SCR-community-standards, Figma 1161:8944): the Live board keyvisual
 * under the translucent header, ROOT FURTHER logo (451×200), then the static standards copy.
 */
export default async function CommunityStandardsPage() {
  await requireSunner();
  const t = await getTranslations("awardsPortal.standards");
  return (
    <main className="relative isolate -mt-20 flex flex-col gap-8 overflow-x-clip pt-36 pb-24 md:pt-46">
      <LiveBoardKeyvisualBackground />
      <div className={`${portalColumn} flex flex-col gap-8`}>
        <Image
          src="/images/awards-portal/root-further-logo.webp"
          alt={t("logoAlt")}
          width={451}
          height={200}
          preload
          sizes="(min-width: 768px) 451px, 280px"
          className="h-auto w-70 md:w-[451px]"
        />
        <CommunityStandardsContent />
      </div>
    </main>
  );
}
