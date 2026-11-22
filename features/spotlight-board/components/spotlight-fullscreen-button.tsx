"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { focusRing } from "@/features/app-shell/components/shell-styles";

type SpotlightFullscreenButtonProps = {
  active: boolean;
  onToggle(): void;
};

/**
 * Pan-zoom button (E08, Figma 30 px at bottom-right 39/48): enters or leaves fullscreen for the
 * board; Esc also leaves. It sits inside the fullscreen element, so focus stays on it both ways.
 */
export function SpotlightFullscreenButton({ active, onToggle }: SpotlightFullscreenButtonProps) {
  const t = useTranslations("spotlight");
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={active ? t("exitFullscreen") : t("enterFullscreen")}
      className={`absolute right-3 bottom-3 z-10 flex size-10 items-center justify-center rounded-full transition-colors hover:bg-secondary-hover md:right-8 md:bottom-11 ${focusRing}`}
    >
      <Image src="/images/spotlight/ic-pan-zoom.svg" alt="" width={30} height={30} aria-hidden />
    </button>
  );
}
