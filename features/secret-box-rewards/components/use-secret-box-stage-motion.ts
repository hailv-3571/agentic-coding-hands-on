"use client";

import { useEffect, type RefObject } from "react";
import type { OpenSecretBoxResult } from "../schemas/secret-box-views";
import type { OpenerPhase } from "./secret-box-opener";
import { prefersReducedMotion } from "./use-secret-box-opener";

/** Gentle wobble of the closed box while the open request is in flight. */
const WOBBLE: Keyframe[] = [
  { transform: "rotate(0deg) scale(1)" },
  { transform: "rotate(-1.5deg) scale(1.02)" },
  { transform: "rotate(1.5deg) scale(1.02)" },
  { transform: "rotate(0deg) scale(1)" },
];

/** The won icon/gift rising out of the open box. */
const REVEAL: Keyframe[] = [
  { opacity: 0, transform: "translateY(18%) scale(0.6)" },
  { opacity: 1, transform: "translateY(0) scale(1)" },
];

/**
 * Box animations through the Web Animations API (no global keyframes needed). Figma marks them
 * prototype-only, so timing is ours. Nothing runs under `prefers-reduced-motion`: the frames
 * then simply switch.
 */
export function useSecretBoxStageMotion(
  boxRef: RefObject<HTMLElement | null>,
  prizeRef: RefObject<HTMLElement | null>,
  phase: OpenerPhase,
  result: OpenSecretBoxResult | null,
) {
  useEffect(() => {
    const box = boxRef.current;
    if (phase !== "opening" || !box || prefersReducedMotion()) return;
    const animation = box.animate(WOBBLE, { duration: 450, iterations: Infinity, easing: "ease-in-out" });
    return () => animation.cancel();
  }, [boxRef, phase]);

  useEffect(() => {
    const prize = prizeRef.current;
    if (!result || !prize || prefersReducedMotion()) return;
    const animation = prize.animate(REVEAL, { duration: 600, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    return () => animation.cancel();
  }, [prizeRef, result]);
}
