"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders fixed overlays (the composer modal, toasts) at the end of <body>. Inside a card they
 * would sit under transformed ancestors (the carousel track, the title row's centred pen), which
 * become the containing block of `position: fixed` and clip the overlay; neighbour slides are
 * also `inert`. Mount it only after a user action (never during SSR: it needs `document`).
 */
export function DocumentBodyPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
