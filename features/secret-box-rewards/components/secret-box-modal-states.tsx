"use client";

import Image from "next/image";
import { useRef, type RefObject } from "react";
import { useTranslations } from "next-intl";
import type { OpenSecretBoxResult } from "../schemas/secret-box-views";
import { formatBoxCount } from "./secret-box-format";
import { SecretBoxIconImage } from "./secret-box-icon-image";
import type { OpenerState } from "./secret-box-opener";
import { focusRing, modalBigText, modalSmallText } from "./secret-box-styles";
import { useSecretBoxStageMotion } from "./use-secret-box-stage-motion";

/** The three 557² box frames; all stay mounted (stacked) so switching frames never waits on a download. */
const BOX_FRAMES = [
  { key: "idle", src: "/images/secret-box/box-unopened.webp" },
  { key: "opening", src: "/images/secret-box/box-opening.webp" },
  { key: "result", src: "/images/secret-box/box-opened-standby.webp" },
] as const;

const loaded = (state: OpenerState) => state.phase !== "loading" && state.phase !== "unavailable";

/** The box opens on click only while waiting / showing a result and a box is left. */
export function boxIsClickable(state: OpenerState): boolean {
  return (state.phase === "waiting" || state.phase === "result") && state.unopened > 0;
}

/** Gift or completed set → "Chúc mừng…" title (Figma 2995:15754 / 2995:15708). */
export function isCongratsResult(state: OpenerState): boolean {
  return state.phase === "result" && Boolean(state.result && (state.result.kind === "gift" || state.result.setCompleted));
}

/**
 * Line under the header: the click hint, the no-box message (E11), or the load error with retry.
 * None on a gift / completed-set result (Figma 2995:15754: the prize name takes its place).
 */
export function SecretBoxHintLine({ state, onReload }: { state: OpenerState; onReload(): void }) {
  const t = useTranslations("secretBox");
  if (isCongratsResult(state)) return null;
  if (state.phase === "unavailable") {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-center gap-3 text-center">
        <p className={modalSmallText}>{t("modal.loadFailed")}</p>
        <button type="button" onClick={onReload} className={`rounded border border-border bg-secondary px-3 py-1 hover:bg-secondary-hover ${modalSmallText} ${focusRing}`}>
          {t("retry")}
        </button>
      </div>
    );
  }
  const text = state.phase !== "loading" && state.unopened === 0 && state.phase !== "opening" ? t("modal.empty") : t("modal.hint");
  return <p className={`text-center ${modalSmallText} ${state.phase === "loading" ? "invisible" : ""}`}>{text}</p>;
}

function SecretBoxPrize({ result, prizeRef }: { result: OpenSecretBoxResult; prizeRef: RefObject<HTMLSpanElement | null> }) {
  if (result.kind === "icon" && result.iconCode) {
    // Figma 1466:7614: a 185 px circle at top 44 of the 557 box, with a soft gold glow. No transform
    // classes here: the reveal animation owns `transform`.
    return (
      <span ref={prizeRef} className="absolute top-[7.9%] left-[33.4%] w-[33.2%]">
        <SecretBoxIconImage code={result.iconCode} alt="" className="w-full shadow-[0_0_40px_12px_rgba(250,226,135,0.55)]" />
      </span>
    );
  }
  // Gifts have no product photo yet (decision-log 2026-11-22): a gold glow over the open box.
  return (
    <span
      ref={prizeRef}
      aria-hidden
      className="absolute top-[4%] left-[22%] aspect-square w-[56%] rounded-full bg-[radial-gradient(circle,rgba(255,234,158,0.6)_0%,rgba(255,234,158,0.18)_45%,transparent_70%)]"
    />
  );
}

/** The 557² box (whole image = the button; Enter/Space natively). Locked while loading/opening/empty. */
export function SecretBoxStage({ state, onOpen }: { state: OpenerState; onOpen(): void }) {
  const t = useTranslations("secretBox.modal");
  const boxRef = useRef<HTMLButtonElement>(null);
  const prizeRef = useRef<HTMLSpanElement>(null);
  const result = state.phase === "result" ? state.result : null;
  useSecretBoxStageMotion(boxRef, prizeRef, state.phase, result);
  const clickable = boxIsClickable(state);
  const frame = result ? "result" : state.phase === "opening" ? "opening" : "idle";
  const dimmed = state.phase === "empty" || state.phase === "unavailable";

  return (
    <button
      ref={boxRef}
      type="button"
      data-autofocus
      aria-label={t("openBox")}
      aria-disabled={!clickable || undefined}
      onClick={() => clickable && onOpen()}
      className={`relative aspect-square w-full max-w-139.25 shrink-0 rounded-md ${clickable ? "cursor-pointer" : "cursor-default"} ${dimmed ? "opacity-50" : ""} ${focusRing}`}
    >
      {BOX_FRAMES.map((box) => (
        <Image
          key={box.key}
          src={box.src}
          alt=""
          fill
          // Already 557² webp exports (17–41 kB): served as they are, no optimizer round trip.
          unoptimized
          loading="eager"
          draggable={false}
          className={`object-cover ${frame === box.key ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      {result && <SecretBoxPrize result={result} prizeRef={prizeRef} />}
    </button>
  );
}

/**
 * Under the box: the gift name (Figma 2995:15754), the mystery gift when the set completes, or E08
 * "Bạn đã có icon này rồi" for an icon the user already owned.
 */
export function SecretBoxPrizeName({ state }: { state: OpenerState }) {
  const t = useTranslations("secretBox.modal");
  const result = state.phase === "result" ? state.result : null;
  if (!result) return null;
  if (result.setCompleted) {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <p className={modalSmallText}>{t("setCompleted")}</p>
        {result.giftName && <p className={modalBigText}>{result.giftName}</p>}
      </div>
    );
  }
  if (result.kind === "gift") return <p className={`text-center ${modalBigText}`}>{result.name}</p>;
  return result.duplicate ? <p className={`text-center ${modalSmallText}`}>{t("duplicateIcon")}</p> : null;
}

/** "Secretbox chưa mở 05". */
export function SecretBoxCounter({ state }: { state: OpenerState }) {
  const t = useTranslations("secretBox.modal");
  return (
    <p className="flex items-center gap-2">
      <span className={modalSmallText}>{t("unopenedLabel")}</span>
      <span className={`${modalBigText} ${loaded(state) ? "" : "animate-pulse text-text-muted motion-reduce:animate-none"}`}>
        {loaded(state) ? formatBoxCount(state.unopened) : "--"}
      </span>
    </p>
  );
}

/** Screen-reader announcement of the opening, the prize and what is left (spec § 9). */
export function SecretBoxAnnouncement({ state }: { state: OpenerState }) {
  const t = useTranslations("secretBox.modal");
  const result = state.phase === "result" ? state.result : null;
  let text = "";
  if (state.phase === "opening") text = t("opening");
  else if (state.phase === "empty") text = t("empty");
  else if (result) {
    const prize = result.kind === "icon" ? t("resultIcon", { name: result.name }) : t("resultGift", { name: result.name });
    const set = result.setCompleted ? ` ${t("setCompleted")}: ${result.giftName ?? ""}.` : "";
    const duplicate = result.kind === "icon" && result.duplicate ? ` ${t("duplicateIcon")}.` : "";
    text = `${prize}${set}${duplicate} ${t("unopenedLeft", { count: state.unopened })}`;
  }
  return (
    <p role="status" className="sr-only">
      {text}
    </p>
  );
}
