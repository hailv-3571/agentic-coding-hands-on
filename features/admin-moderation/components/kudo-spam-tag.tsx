import { useTranslations } from "next-intl";

/**
 * Orange "Spam" tag on the author's own spam Kudo (Figma 3127:24099, decision-log 2026-11-22):
 * #FF8104 (no token), 1 px #EAEAEA, rounded 4, 72 wide, px16 py8, Bold 16/24 (.5) white, at the
 * top-right of the info row. Stacked above the alert overlay so it stays readable over the blur.
 * The host card must be `relative`. Text, not colour, carries the meaning.
 */
export function KudoSpamTag() {
  const t = useTranslations("adminModeration.ownerSpam");
  return (
    <span className="absolute top-3 right-3 z-20 inline-flex w-18 items-center justify-center rounded border border-[#EAEAEA] bg-[#FF8104] px-4 py-2 text-body-large font-bold text-text md:top-10 md:right-0">
      {t("tag")}
    </span>
  );
}
