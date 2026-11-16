"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { ComposerIcon, type ComposerIconName } from "./composer-icon";
import { communityLinkColor, focusRing } from "./composer-styles";

export type FormatAction = "bold" | "italic" | "strikethrough" | "numbered" | "link" | "quote";

/** Figma order: bold, italic, strikethrough, numbered list, link, quote. */
const ACTIONS: { action: FormatAction; icon: ComposerIconName }[] = [
  { action: "bold", icon: "bold" },
  { action: "italic", icon: "italic" },
  { action: "strikethrough", icon: "strikethrough" },
  { action: "numbered", icon: "numbered-list" },
  { action: "link", icon: "link" },
  { action: "quote", icon: "quote" },
];

type KudoMessageToolbarProps = {
  textareaId: string;
  onFormat(action: FormatAction): void;
  disabled?: boolean;
};

const cell = `flex h-10 items-center justify-center border border-border px-4 py-2.5 ${focusRing}`;

/**
 * Formatting row above the message (decision-log 2026-11-15, Markdown toolbar). Buttons keep the
 * textarea focused on mouse down so the selection they act on stays visible. The last cell links
 * to "Tiêu chuẩn cộng đồng" in a new tab, so following it never loses the draft.
 */
export function KudoMessageToolbar({ textareaId, onFormat, disabled = false }: KudoMessageToolbarProps) {
  const t = useTranslations("kudosComposer.message");
  return (
    <div role="group" aria-label={t("toolbar.label")} aria-controls={textareaId} className="flex flex-wrap">
      {ACTIONS.map(({ action, icon }) => (
        <button
          key={action}
          type="button"
          disabled={disabled}
          aria-label={t(`toolbar.${action}`)}
          title={t(`toolbar.${action}`)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onFormat(action)}
          className={`${cell} -ml-px transition-colors first:ml-0 first:rounded-tl-lg hover:bg-border/30 active:bg-border/30 disabled:opacity-50`}
        >
          <ComposerIcon name={icon} />
        </button>
      ))}
      <Link
        href={APP_ROUTES.communityStandards}
        target="_blank"
        rel="noopener noreferrer"
        className={`${cell} -mt-px basis-full text-title-medium sm:-ml-px font-bold underline underline-offset-2 sm:mt-0 sm:flex-1 sm:basis-auto sm:rounded-tr-lg ${communityLinkColor}`}
      >
        {t("communityStandards")}
      </Link>
    </div>
  );
}
