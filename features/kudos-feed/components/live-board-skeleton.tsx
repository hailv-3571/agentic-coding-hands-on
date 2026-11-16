import { KudoComposerLauncherPlaceholder } from "@/features/kudos-authoring/components/kudo-composer-launcher";
import { pageColumn } from "./kudo-feed-styles";

const block = "animate-pulse rounded-3xl bg-secondary motion-reduce:animate-none";

/**
 * Loading state of the Live board (spec § 5 "skeleton") while the request-time part streams in:
 * the action row pills, the Highlight header and card, and two feed cards, at their real sizes.
 */
export function LiveBoardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-16">
      <div className={`${pageColumn} grid gap-4 lg:grid-cols-[738fr_381fr] lg:gap-8`}>
        <KudoComposerLauncherPlaceholder />
        <KudoComposerLauncherPlaceholder />
      </div>
      <div className={`${pageColumn} flex flex-col gap-10`}>
        <div className="h-32 animate-pulse rounded bg-secondary motion-reduce:animate-none" />
        <div className={`${block} mx-auto h-131 w-full max-w-132`} />
      </div>
      <div className={`${pageColumn} flex flex-col gap-6`}>
        <div className={`${block} h-180 w-full max-w-170`} />
        <div className={`${block} h-180 w-full max-w-170`} />
      </div>
    </div>
  );
}
