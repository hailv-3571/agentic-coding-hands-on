import { Fragment } from "react";
import { getTranslations } from "next-intl/server";
import { formatAwardAmount, formatAwardQuantity, type Award } from "../data/awards-data";
import { PortalIcon } from "./portal-icon";
import { divider, smallBold } from "./portal-styles";

const factLabel = "flex items-center gap-4 text-headline-small font-bold text-primary";
const factNumber = "text-display-small font-bold text-text";

/**
 * Quantity and value rows of an award block (Figma 313:8467 / 313:8471): ◇ "Số lượng giải
 * thưởng:" + 2-digit count + unit (60 wide, wraps); divider; ⚘ "Giá trị giải thưởng:" + amount
 * + optional note. Signature lists its second value after a "Hoặc" rule.
 */
export async function AwardPrizeFacts({ award }: { award: Award }) {
  const t = await getTranslations("awardsPortal");
  return (
    <>
      <dl className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <dt className={factLabel}>
          <PortalIcon name="diamond" />
          {t("awardsPage.quantityLabel")}
        </dt>
        <dd className="flex items-center gap-4">
          <span className={factNumber}>{formatAwardQuantity(award.quantity)}</span>{" "}
          <span className={`w-15 ${smallBold}`}>{t(`awardUnits.${award.unitKey}`)}</span>
        </dd>
      </dl>
      <div className={divider} />
      <div className="flex flex-col gap-8">
        {award.values.map((value, index) => (
          <Fragment key={value.amountVnd}>
            {index > 0 && (
              <p className="flex items-center gap-2 text-label-large font-bold text-divider">
                {t("awardsPage.or")}
                <span aria-hidden className="h-px flex-1 bg-divider" />
              </p>
            )}
            <dl className="flex flex-col gap-4">
              <dt className={factLabel}>
                <PortalIcon name="license" />
                {t("awardsPage.valueLabel")}
              </dt>
              <dd className="flex flex-col gap-4">
                <span className={factNumber}>{formatAwardAmount(value.amountVnd)}</span>
                {value.noteKey && <span className={smallBold}>{t(`awardValueNotes.${value.noteKey}`)}</span>}
              </dd>
            </dl>
          </Fragment>
        ))}
      </div>
    </>
  );
}
