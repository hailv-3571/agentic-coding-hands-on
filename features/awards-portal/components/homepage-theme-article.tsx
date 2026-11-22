import Image from "next/image";
import { getTranslations } from "next-intl/server";

/**
 * "Root Further" theme article (Figma 3204:10152): w 1152 centred, px104 py120, gap 32. The
 * stacked wordmark (290 wide), then Bold 24/32 justified copy: block 1, the centred quote
 * (24/32 + 20/32), block 2. Paragraphs inside a block are `\n`-separated in messages (no gap
 * between them, as drawn), so BTC can rewrite the copy in JSON alone.
 */
export async function HomepageThemeArticle() {
  const t = await getTranslations("awardsPortal.home");
  const block = "whitespace-pre-line text-justify";
  return (
    <article className="mx-auto flex w-full max-w-288 flex-col items-center gap-8 py-16 md:px-26 md:py-30">
      <h2>
        <Image
          src="/images/awards-portal/root-further-logo.webp"
          alt={t("logoAlt")}
          width={451}
          height={200}
          sizes="(min-width: 768px) 290px, 200px"
          className="h-auto w-50 md:w-[290px]"
        />
      </h2>
      <div className="flex flex-col gap-8 text-body-large font-bold text-text md:text-headline-small">
        <p className={block}>{t("theme.block1")}</p>
        <blockquote className="text-center">
          <p>{t("theme.quote")}</p>
          <p className="text-title-medium font-bold md:text-kudos">{t("theme.quoteNote")}</p>
        </blockquote>
        <p className={block}>{t("theme.block2")}</p>
      </div>
    </article>
  );
}
