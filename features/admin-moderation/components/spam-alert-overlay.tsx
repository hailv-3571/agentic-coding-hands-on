import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * Alert Overlay over the author's own spam Kudo (Figma 3127:24672; D012 + decision-log 2026-11-22,
 * no close button): on its detail panel now and on the Profile "Đã gửi" card in phase 12; the Live
 * board never lists spam. It covers the whole host (`relative`) card: the content underneath is
 * blurred (backdrop blur ≈5 px) under a rgba(87,87,87,.7) veil (no token), with the warning
 * triangle (≈48 % of the card width) and "Cảnh báo vi phạm tiêu chuẩn cộng đồng" Bold 32/40 white
 * (22/28 on phones) centred. The overlay takes the pointer, so nothing underneath is clickable; the
 * host also keeps its links out of the Tab order (`tabbable={false}`, review W1) but not `inert`,
 * so the card's text stays readable by screen readers, and this note is read first (render it
 * before the card content).
 */
export function SpamAlertOverlay() {
  const t = useTranslations("adminModeration.ownerSpam");
  return (
    <div
      role="note"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-[inherit] bg-[#575757]/70 px-6 text-center backdrop-blur-[5px]"
    >
      <Image
        src="/images/admin-moderation/spam-overlay-warning-triangle.svg"
        width={331}
        height={290}
        alt=""
        aria-hidden
        draggable={false}
        className="h-auto w-[48%] max-w-83"
      />
      <p className="max-w-[14em] text-title-large font-bold text-balance text-text [text-shadow:0_4px_4px_rgb(0_0_0/0.25)] md:text-headline-large md:font-bold">
        {t("warning")}
      </p>
      <p className="sr-only">{t("hidden")}</p>
    </div>
  );
}
