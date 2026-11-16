"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useSunnerSearch } from "@/features/sunner-search/components/use-sunner-search";
import type { SunnerOption } from "@/features/sunner-search/schemas/sunner-option";
import { KUDO_LIMITS, kudoTextLength } from "../kudo-authoring-limits";
import { AddLinkPopover } from "./add-link-popover";
import { errorText, focusRing } from "./composer-styles";
import * as md from "./kudo-markdown-format";
import { KudoMentionPopover } from "./kudo-mention-popover";
import { KudoMessageToolbar, type FormatAction } from "./kudo-message-toolbar";

type KudoMessageEditorProps = {
  value: string;
  onChange(value: string): void;
  errors: string[];
  invalid: boolean;
  /** Tells the dialog a nested dialog (Add link) owns focus and Esc. */
  onNestedDialogChange(open: boolean): void;
};

const MARKERS = { bold: "**", italic: "_", strikethrough: "~~" } as const;

/**
 * Lời nhắn (FR-202/203/207): restricted-Markdown textarea with the 6-button toolbar, a live
 * "N/1.000" counter in code points (kudoTextLength) with a hard stop at 1,000, "@" mentions from
 * the shared Sunner search (excludeSelf=false) and the Add link dialog.
 *
 * Mention ARIA (review W2): the textarea keeps its native multiline textbox role. ARIA in HTML
 * allows no other role on <textarea>, and an ARIA 1.2 combobox is single-line (no
 * aria-multiline), so role="combobox" would hide that this is a multi-line editor. Instead it
 * carries the textbox-supported popup attributes — aria-autocomplete="list",
 * aria-haspopup="listbox", aria-controls / aria-activedescendant only while the list is open —
 * and a polite live region announces the suggestion count (textbox has no aria-expanded).
 */
export function KudoMessageEditor({ value, onChange, errors, invalid, onNestedDialogChange }: KudoMessageEditorProps) {
  const t = useTranslations("kudosComposer.message");
  const tSearch = useTranslations("sunnerSearch");
  const format = useFormatter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const listId = useId();
  const [mention, setMention] = useState<md.MentionQuery | null>(null);
  /** Last inserted "@Full Name " token: names hold spaces, so it would read as a new query. */
  const picked = useRef<{ start: number; token: string } | null>(null);
  const [mentionCursor, setMentionCursor] = useState({ query: "", index: 0 });
  const [linkTarget, setLinkTarget] = useState<{ start: number; end: number; text: string } | null>(null);
  const mentionQuery = mention?.query ?? "";
  const { status, results } = useSunnerSearch(mentionQuery, { limit: 5 });

  const mentionOpen = mention !== null && status === "ready" && results.length > 0;
  const activeIndex = mentionCursor.query === mentionQuery ? Math.min(mentionCursor.index, results.length - 1) : 0;
  const optionId = (index: number) => `${listId}-option-${index}`;

  function applyEdit(edit: md.TextEdit | null) {
    if (!edit) return false;
    onChange(edit.value);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
    return true;
  }

  function runFormat(action: FormatAction) {
    const element = textareaRef.current;
    if (!element) return;
    const { selectionStart: start, selectionEnd: end } = element;
    if (action === "link") {
      setLinkTarget({ start, end, text: value.slice(start, end) });
      onNestedDialogChange(true);
    } else if (action === "numbered" || action === "quote") {
      applyEdit(md.prefixSelectedLines(value, start, end, action));
    } else {
      applyEdit(md.wrapSelection(value, start, end, MARKERS[action]));
    }
  }

  function closeLink() {
    setLinkTarget(null);
    onNestedDialogChange(false);
  }

  function pickMention(option: SunnerOption) {
    const caret = textareaRef.current?.selectionStart ?? value.length;
    if (mention && applyEdit(md.insertMention(value, mention, caret, option.fullName))) {
      picked.current = { start: mention.start, token: `@${option.fullName} ` };
    }
    setMention(null);
  }

  function trackMention(element: HTMLTextAreaElement) {
    const { selectionStart, selectionEnd, value: text } = element;
    const query = selectionStart === selectionEnd ? md.findMentionQuery(text, selectionStart) : null;
    const done = picked.current;
    // Typing on after a picked, still intact mention does not reopen the list for it.
    setMention(query && done?.start === query.start && text.startsWith(done.token, done.start) ? null : query);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!mentionOpen) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = activeIndex + (event.key === "ArrowDown" ? 1 : -1);
      setMentionCursor({ query: mentionQuery, index: (next + results.length) % results.length });
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      pickMention(results[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setMention(null);
    }
  }

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        {t("label")}
      </label>
      <div className="relative">
        <KudoMessageToolbar textareaId={id} onFormat={runFormat} />
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          placeholder={t("placeholder")}
          aria-required
          aria-invalid={invalid || undefined}
          aria-describedby={errors.length > 0 ? `${hintId} ${errorId}` : hintId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls={mentionOpen ? listId : undefined}
          aria-activedescendant={mentionOpen ? optionId(activeIndex) : undefined}
          onChange={(event) => {
            onChange(md.clampToLength(event.target.value, KUDO_LIMITS.BODY_MAX));
            trackMention(event.target);
          }}
          onSelect={(event) => trackMention(event.currentTarget)}
          onBlur={() => setMention(null)}
          onKeyDown={handleKeyDown}
          className={`-mt-px block h-50 min-h-30 w-full resize-y rounded-b-lg border border-border bg-white px-6 py-4 text-title-medium font-bold text-on-primary placeholder:text-text-muted ${focusRing}`}
        />
        {mentionOpen && (
          <KudoMentionPopover
            listId={listId}
            options={results}
            activeIndex={activeIndex}
            optionId={optionId}
            onActiveChange={(index) => setMentionCursor({ query: mentionQuery, index })}
            onPick={pickMention}
          />
        )}
        <span className="sr-only" aria-live="polite">
          {mentionOpen ? tSearch("resultCount", { count: results.length }) : ""}
        </span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <p id={hintId} className="text-title-medium font-bold text-on-primary">
          {t("mentionHint")}
        </p>
        <p className="ml-auto text-title-medium font-bold text-text-muted">
          {format.number(kudoTextLength(value))}/{format.number(KUDO_LIMITS.BODY_MAX)}
        </p>
      </div>
      {errors.length > 0 && (
        <p id={errorId} className={errorText}>
          {errors.join(" ")}
        </p>
      )}
      {linkTarget && (
        <AddLinkPopover
          initialText={linkTarget.text}
          onCancel={closeLink}
          onSave={(text, url) => {
            if (!applyEdit(md.insertLink(value, linkTarget.start, linkTarget.end, text, url))) return t("linkTooLong");
            closeLink();
            return null;
          }}
        />
      )}
    </div>
  );
}
