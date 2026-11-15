"use client";

import { useCallback, useId, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { locales, isLocale, type Locale } from "@/shared/i18n/locales";
import { setLocaleAction } from "@/shared/i18n/set-locale-action";
import { useDismissable } from "../hooks/use-dismissable";
import { CaretDownIcon, UkFlagIcon, VietnamFlagIcon } from "./shell-icons";
import { dropdownItem, dropdownPanel, headerTrigger } from "./shell-styles";

const FLAGS = { vi: VietnamFlagIcon, en: UkFlagIcon } as const;

/** Current-language button with a Tiếng Việt / English list (FR-202). Shared by every layout. */
export function LanguageSwitcher() {
  const t = useTranslations("shell.language");
  const currentRaw = useLocale();
  const current: Locale = isLocale(currentRaw) ? currentRaw : "vi";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);

  useDismissable(open, close, containerRef, triggerRef);

  const code = (locale: Locale) => (locale === "vi" ? t("codeVi") : t("codeEn"));
  const CurrentFlag = FLAGS[current];

  function select(locale: Locale) {
    setOpen(false);
    if (locale === current) return;
    setFailed(false);
    startTransition(async () => {
      try {
        const result = await setLocaleAction(locale);
        if (result.ok) router.refresh();
        else setFailed(true);
      } catch (error) {
        // Network/server failure of the action: tell the user instead of silently staying put.
        console.error("[i18n] language switch failed", error);
        setFailed(true);
      }
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        // Label in name (WCAG 2.5.3): the name starts with the visible code, e.g. "VN, Ngôn ngữ: Tiếng Việt".
        aria-label={`${code(current)}, ${t("label")}: ${t(current)}`}
        disabled={pending}
        onClick={() => {
          setFailed(false);
          setOpen((value) => !value);
        }}
        className={`${headerTrigger} px-2 py-2 disabled:opacity-60`}
      >
        <CurrentFlag />
        <span>{code(current)}</span>
        <CaretDownIcon />
      </button>
      {open && (
        <ul id={panelId} className={`${dropdownPanel} right-0 min-w-32 list-none`}>
          {locales.map((locale) => {
            const Flag = FLAGS[locale];
            const selected = locale === current;
            return (
              <li key={locale}>
                <button
                  type="button"
                  lang={locale}
                  aria-label={`${code(locale)} ${t(locale)}`}
                  aria-pressed={selected}
                  onClick={() => select(locale)}
                  className={`${dropdownItem} justify-center ${selected ? "bg-secondary" : ""}`}
                >
                  <Flag />
                  <span>{code(locale)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {failed && (
        <p
          role="alert"
          className="absolute top-full right-0 z-50 mt-2 w-max max-w-64 rounded-lg border border-error bg-container-2 px-3 py-2 text-body-medium text-error"
        >
          {t("switchFailed")}
        </p>
      )}
    </div>
  );
}
