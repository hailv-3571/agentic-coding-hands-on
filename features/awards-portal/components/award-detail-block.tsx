import { getTranslations } from "next-intl/server";
import type { Award } from "../data/awards-data";
import { AwardPrizeFacts } from "./award-prize-facts";
import { AwardThumbnail } from "./award-thumbnail";
import { PortalIcon } from "./portal-icon";
import { divider } from "./portal-styles";

type AwardDetailBlockProps = {
  award: Award;
  /** Figma alternates: Top Talent, Top Project Leader, Signature left; the others right. */
  imageSide: "left" | "right";
  /** Every block but the last ends with a 1 px #2E3940 rule. */
  last: boolean;
};

/**
 * One award on /awards (Figma 313:8467): `id=<slug>` anchor target (scroll margin clears the
 * sticky header and, on phones, the chip bar). Thumbnail 336 + content 480 side by side from
 * `xl` (gap 40); stacked with the image on top below that.
 */
export async function AwardDetailBlock({ award, imageSide, last }: AwardDetailBlockProps) {
  const t = await getTranslations("awardsPortal.awards");
  const name = t(`${award.slug}.name`);
  const titleId = `${award.slug}-title`;
  return (
    <section
      id={award.slug}
      aria-labelledby={titleId}
      tabIndex={-1}
      className="flex scroll-mt-40 flex-col gap-12 outline-none md:scroll-mt-28 md:gap-20"
    >
      <div className={`flex flex-col items-center gap-10 xl:items-start ${imageSide === "right" ? "xl:flex-row-reverse" : "xl:flex-row"}`}>
        <AwardThumbnail src={award.imageSrc} alt={name} />
        <div className="flex w-full flex-col gap-8 rounded-2xl backdrop-blur-[32px] xl:w-120 xl:shrink-0">
          <div className="flex flex-col gap-6">
            <h2 id={titleId} className="flex items-center gap-4 text-headline-small font-bold text-primary">
              <PortalIcon name="target" />
              {name}
            </h2>
            <p className="text-justify text-body-large font-bold whitespace-pre-line text-text">{t(`${award.slug}.long`)}</p>
          </div>
          <div className={divider} />
          <AwardPrizeFacts award={award} />
        </div>
      </div>
      {!last && <div className={divider} />}
    </section>
  );
}
