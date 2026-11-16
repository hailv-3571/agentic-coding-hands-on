import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  KudoComposerLauncher,
  KudoComposerLauncherPlaceholder,
} from "@/features/kudos-authoring/components/kudo-composer-launcher";
import { KudoEditDeepLink } from "@/features/kudos-authoring/components/kudo-edit-deep-link";
import { isKudoWritingOpen } from "@/features/kudos-authoring/server/kudo-write-window";

/** Request-time part: the writing window (clock) and the `?editKudo=` placeholder edit entry. */
async function KudoComposerEntry({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const [writingOpen, params] = await Promise.all([isKudoWritingOpen(), searchParams]);
  const editKudo = typeof params.editKudo === "string" && z.uuid().safeParse(params.editKudo).success ? params.editKudo : null;
  return (
    <>
      <KudoComposerLauncher writingOpen={writingOpen} />
      <KudoEditDeepLink kudoId={editKudo} />
    </>
  );
}

// Placeholder until phase 07 (awards portal) owns the real homepage. It hosts the Kudo composer
// launcher (and the `?editKudo=` edit entry) until phase 05 moves both to the Live board.
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const t = await getTranslations("common");
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-8 text-center md:p-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-display-small text-primary">{t("appName")}</h1>
        <p className="text-body-large text-text-muted">{t("comingSoon")}</p>
      </div>
      <div className="w-full max-w-3xl">
        <Suspense fallback={<KudoComposerLauncherPlaceholder />}>
          <KudoComposerEntry searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
