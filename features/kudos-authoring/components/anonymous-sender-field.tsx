"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { KUDO_LIMITS } from "../kudo-authoring-limits";
import { ComposerFieldRow } from "./composer-field-row";
import { focusRing, textInput } from "./composer-styles";
import { clampToLength } from "./kudo-markdown-format";

type AnonymousSenderFieldProps = {
  isAnonymous: boolean;
  nickname: string;
  onAnonymousChange(value: boolean): void;
  onNicknameChange(value: string): void;
  nicknameErrors: string[];
};

/**
 * "Gửi lời cám ơn và ghi nhận ẩn danh" (FR-208) + "Nickname ẩn danh*" (decision-log 2026-11-15:
 * required 1–30 when anonymous). Checkbox per Figma: 24 px white box, gold border, rounded 4;
 * checked = 16 px #998C5F square. The label is muted while unchecked (frame 520:11602).
 */
export function AnonymousSenderField(props: AnonymousSenderFieldProps) {
  const { isAnonymous, nickname, onAnonymousChange, onNicknameChange, nicknameErrors } = props;
  const t = useTranslations("kudosComposer.anonymous");
  const checkboxId = useId();
  const nicknameId = useId();
  const errorId = `${nicknameId}-error`;
  return (
    <div className="flex flex-col gap-8">
      <label htmlFor={checkboxId} className="flex cursor-pointer items-center gap-4">
        <span className="relative flex size-6 shrink-0 items-center justify-center">
          <input
            id={checkboxId}
            type="checkbox"
            checked={isAnonymous}
            onChange={(event) => onAnonymousChange(event.target.checked)}
            className={`peer size-6 cursor-pointer appearance-none rounded border border-border bg-white ${focusRing}`}
          />
          <span aria-hidden className="pointer-events-none absolute size-4 rounded-[2px] bg-border opacity-0 peer-checked:opacity-100" />
        </span>
        <span className={`text-title-large font-bold ${isAnonymous ? "text-on-primary" : "text-text-muted"}`}>{t("label")}</span>
      </label>
      {isAnonymous && (
        <ComposerFieldRow label={t("nickname")} htmlFor={nicknameId} required errors={nicknameErrors} errorId={errorId}>
          <input
            id={nicknameId}
            type="text"
            value={nickname}
            aria-required
            aria-invalid={nicknameErrors.length > 0 || undefined}
            aria-describedby={nicknameErrors.length > 0 ? errorId : undefined}
            onChange={(event) => onNicknameChange(clampToLength(event.target.value, KUDO_LIMITS.NICKNAME_MAX))}
            className={textInput}
          />
        </ComposerFieldRow>
      )}
    </div>
  );
}
