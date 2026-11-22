import { useTranslations } from "next-intl";
import type { IconCollectionSlot } from "../schemas/secret-box-views";
import { orderIconSlots, secretBoxIconSlug } from "./secret-box-format";
import { SecretBoxIconImage } from "./secret-box-icon-image";

type IconCollectionProps = {
  slots: IconCollectionSlot[];
  /** Accessible name of the list; the host (phase 12 profile) passes its caption, e.g. "Bộ sưu tập icon của tôi". */
  label?: string;
};

/**
 * The 6 Secret Box icons of one Sunner (FR-207, US004): always 6 circles in the fixed order
 * REVIVAL … ROOT FURTHER whatever the input order. Owned → the icon image, with a gold "×N" badge
 * when the quantity is above 1; not owned → an empty grey circle. Each circle is an image whose
 * name says the icon and its state ("REVIVAL, chưa có", "STAY GOLD, số lượng 3"). Icon names are
 * the Thể lệ page messages (one source). For own and other profiles (phase 12). Server/client neutral.
 */
export function IconCollection({ slots, label }: IconCollectionProps) {
  const t = useTranslations("secretBox.iconCollection");
  const iconName = useTranslations("awardsPortal.rules.badges");

  return (
    <ul aria-label={label ?? t("label")} className="flex flex-wrap gap-4">
      {orderIconSlots(slots).map((slot) => {
        const name = iconName(secretBoxIconSlug(slot.iconCode));
        const many = slot.owned && slot.quantity > 1;
        const description = !slot.owned ? t("missing", { name }) : many ? t("ownedMany", { name, quantity: slot.quantity }) : t("owned", { name });
        return (
          <li key={slot.iconCode} className="relative">
            <span role="img" aria-label={description} className="block">
              {slot.owned ? (
                <SecretBoxIconImage code={slot.iconCode} alt="" className="size-16 border border-primary" />
              ) : (
                <span className="block size-16 rounded-full border border-divider bg-text-muted/20" />
              )}
            </span>
            {many && (
              <span aria-hidden className="absolute -right-1 -bottom-1 min-w-7 rounded-full bg-primary px-1.5 text-center text-label-large font-bold text-on-primary">
                ×{slot.quantity}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
