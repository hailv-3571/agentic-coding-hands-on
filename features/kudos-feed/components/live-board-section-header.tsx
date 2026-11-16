import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { sectionTitle } from "./kudo-feed-styles";

type LiveBoardSectionHeaderProps = {
  title: string;
  /** Lets the section use the heading as its accessible name (`aria-labelledby`). */
  headingId?: string;
  /** Right side of the title row (the Highlight filters). */
  children?: ReactNode;
};

/**
 * Section header of the Live board (Figma h129, gap 16): "Sun* Annual Awards 2025" (Bold 24/32
 * white), a 1 px #2E3940 divider, then the gold title (Bold 57/64) with optional controls on the
 * right; the row stacks on small screens.
 */
export function LiveBoardSectionHeader({ title, headingId, children }: LiveBoardSectionHeaderProps) {
  const t = useTranslations("kudosFeed");
  return (
    <div className="flex flex-col gap-4">
      <p className="text-headline-small font-bold text-text">{t("sectionCaption")}</p>
      <div className="h-px w-full bg-divider" />
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 id={headingId} className={sectionTitle}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
