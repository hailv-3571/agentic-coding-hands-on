"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ComposerIcon } from "./composer-icon";
import { errorText, fieldLabel, panelSurface, primaryButton, secondaryButton, textInput } from "./composer-styles";
import { isHttpUrl } from "./kudo-markdown-format";
import { useFocusTrap } from "./use-focus-trap";

type AddLinkPopoverProps = {
  /** The text that was selected in the message (prefills "Nội dung"). */
  initialText: string;
  /** Inserts `[text](url)`; returns an error message when the link cannot be inserted. */
  onSave(text: string, url: string): string | null;
  onCancel(): void;
};

/**
 * "Thêm đường dẫn" (Figma 1002:12917, FR-207): Nội dung + URL, http(s) only (the body link
 * policy rejects anything else). A nested dialog over the composer; Enter saves, Esc cancels.
 * Not a <form>: it renders inside the composer and must not submit anything by itself.
 */
export function AddLinkPopover({ initialText, onSave, onCancel }: AddLinkPopoverProps) {
  const t = useTranslations("kudosComposer.addLink");
  const panelRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(initialText);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const textId = useId();
  const urlId = useId();
  const errorId = useId();
  useFocusTrap(panelRef, true);

  function save() {
    if (!isHttpUrl(url)) return setError(t("urlInvalid"));
    setError(onSave(text, url));
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    } else if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      save();
    }
  }

  const row = "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4";
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-background/80 p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className={`flex w-full max-w-188 flex-col gap-8 rounded-3xl p-6 md:p-10 ${panelSurface}`}
      >
        <h2 id={titleId} className="text-headline-small font-bold md:text-headline-large md:font-bold">
          {t("title")}
        </h2>
        <div className={row}>
          <label htmlFor={textId} className={`shrink-0 ${fieldLabel}`}>
            {t("text")}
          </label>
          <input id={textId} type="text" value={text} onChange={(event) => setText(event.target.value)} className={textInput} />
        </div>
        <div className={row}>
          <label htmlFor={urlId} className={`shrink-0 ${fieldLabel}`}>
            {t("url")}
          </label>
          <input
            id={urlId}
            type="url"
            inputMode="url"
            data-autofocus={initialText ? true : undefined}
            value={url}
            placeholder="https://"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => {
              setUrl(event.target.value);
              setError(null);
            }}
            className={textInput}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className={errorText}>
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-6">
          <button type="button" onClick={onCancel} className={secondaryButton}>
            {t("cancel")}
            <ComposerIcon name="close" />
          </button>
          <button type="button" onClick={save} className={primaryButton}>
            {t("save")}
            <ComposerIcon name="link" />
          </button>
        </div>
      </div>
    </div>
  );
}
