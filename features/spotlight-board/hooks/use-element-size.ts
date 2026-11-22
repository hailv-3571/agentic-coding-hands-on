"use client";

import { useEffect, useState, type RefObject } from "react";

export type ElementSize = { width: number; height: number };

/**
 * Whole-pixel size of `ref`'s element via ResizeObserver; null until measured (server render and
 * first paint), so layout work that needs real pixels waits for the browser.
 */
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize | null {
  const [size, setSize] = useState<ElementSize | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setSize((current) => (current?.width === width && current.height === height ? current : { width, height }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
