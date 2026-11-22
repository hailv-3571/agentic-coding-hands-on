"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type PointerEvent, type Ref } from "react";
import { useTranslations } from "next-intl";
import { openBoxButton, tooltipPanel } from "./secret-box-styles";

type OpenSecretBoxButtonProps = {
  unopened: number;
  onOpen(): void;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * "Mở Secret Box" + ic-open-gift 24 (Figma 2940:13489). With no unopened box it is dimmed and
 * does nothing (DEC-001, FR-203) but stays focusable (`aria-disabled`, not `disabled`), so the
 * tooltip "Bạn chưa có Secret Box nào" shows on hover, keyboard focus and tap, closes on leave,
 * blur and Esc (WCAG 1.4.13), and is the button's description for screen readers. The tooltip's
 * bottom padding bridges the gap to the button, so the pointer can move onto it.
 */
export function OpenSecretBoxButton({ unopened, onOpen, ref }: OpenSecretBoxButtonProps) {
  const t = useTranslations("secretBox");
  const tooltipId = useId();
  const [tipOpen, setTipOpen] = useState(false);
  /** Pointer type of a press on the button that has not reached its click yet. */
  const pressedWith = useRef<string | null>(null);
  const disabled = unopened <= 0;
  const showTip = disabled && tipOpen;

  useEffect(() => {
    if (!showTip) return;
    // Capture phase: the Esc that hides the tooltip is spent on it (WCAG 1.4.13).
    const hideOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setTipOpen(false);
    };
    document.addEventListener("keydown", hideOnEscape, true);
    return () => document.removeEventListener("keydown", hideOnEscape, true);
  }, [showTip]);

  const forMouse = (open: boolean) => (event: PointerEvent) => {
    if (event.pointerType === "mouse") setTipOpen(open);
  };

  return (
    <div className="relative w-full" onPointerEnter={forMouse(true)} onPointerLeave={forMouse(false)}>
      <button
        ref={ref}
        type="button"
        aria-disabled={disabled || undefined}
        aria-describedby={disabled ? tooltipId : undefined}
        onPointerDown={(event) => {
          pressedWith.current = event.pointerType;
        }}
        // Keyboard focus opens it; focus from a press does not (the click decides, so a tap toggles once).
        onFocus={(event) => event.currentTarget.matches(":focus-visible") && setTipOpen(true)}
        onBlur={() => setTipOpen(false)}
        onClick={() => {
          const pointer = pressedWith.current;
          pressedWith.current = null;
          if (!disabled) onOpen();
          else setTipOpen((open) => pointer === "mouse" || !open);
        }}
        className={openBoxButton}
      >
        {t("openButton")}
        <Image src="/images/secret-box/ic-open-gift.svg" width={24} height={24} alt="" aria-hidden draggable={false} className="shrink-0" />
      </button>
      {disabled && (
        <div id={tooltipId} role="tooltip" hidden={!showTip} className="absolute bottom-full left-1/2 z-10 -translate-x-1/2 pb-2">
          <p className={tooltipPanel}>{t("noBoxTooltip")}</p>
        </div>
      )}
    </div>
  );
}
