"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { PortalIcon } from "./portal-icon";
import { focusRing } from "./portal-styles";

export type AwardsAnchorItem = { slug: string; label: string };

/** The "reading line" (share of the viewport height); block scroll margins sit above it. */
const READING_LINE = 0.25;

/** The last block whose top has passed the reading line; above every block, the first one. */
function blockAtReadingLine(slugs: string[]): string {
  const line = window.innerHeight * READING_LINE;
  let current = slugs[0] ?? "";
  for (const slug of slugs) {
    const top = document.getElementById(slug)?.getBoundingClientRect().top;
    if (top !== undefined && top <= line) current = slug;
  }
  return current;
}

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

// Phones: pill chips in a horizontal bar (D009). md+: Figma 313:8459 items (p16, gap 4, Bold 14/20).
const itemBase = `flex items-center gap-1 rounded-full border px-4 py-2 text-body-medium font-bold whitespace-nowrap transition-colors md:rounded-none md:border-x-0 md:border-t-0 md:bg-transparent md:p-4 md:whitespace-normal ${focusRing}`;
const itemActive = "border-primary bg-secondary text-primary [text-shadow:var(--shadow-gold)]";
const itemIdle = "border-border text-text hover:text-primary hover:[text-shadow:var(--shadow-gold)] md:border-transparent";

/**
 * Left anchor menu of /awards (FR-302/303): sticky column on desktop, chip bar under the header
 * on phones. The block at the reading line is marked active (`aria-current`); a click scrolls
 * to the block (instantly under reduced motion), focuses it and writes the hash with
 * `history.replaceState`. Links stay real `#slug` anchors without JavaScript.
 */
export function AwardsAnchorMenu({ items, label }: { items: AwardsAnchorItem[]; label: string }) {
  const [active, setActive] = useState(items[0]?.slug ?? "");
  const listRef = useRef<HTMLUListElement>(null);
  const slugKey = items.map((item) => item.slug).join(" ");

  // Position-based (not IntersectionObserver): a jump such as Home or "back to top" crosses no
  // block on the way, so only re-reading positions keeps the highlight right. One read per frame.
  useEffect(() => {
    const slugs = slugKey.split(" ");
    let frame = 0;
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0;
        setActive(blockAtReadingLine(slugs));
      });
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [slugKey]);

  // Keep the active chip in view inside the phone chip bar (scrolls the bar, never the page).
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    if (!list || !chip || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: chip.offsetLeft - 16, behavior: scrollBehavior() });
  }, [active]);

  const onSelect = (event: MouseEvent<HTMLAnchorElement>, slug: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const block = document.getElementById(slug);
    if (!block) return;
    event.preventDefault();
    block.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    block.focus({ preventScroll: true });
    window.history.replaceState(null, "", `#${slug}`);
    setActive(slug);
  };

  return (
    <nav
      aria-label={label}
      className="sticky top-20 z-30 -mx-4 bg-background/90 px-4 py-3 backdrop-blur md:top-24 md:mx-0 md:self-start md:bg-transparent md:p-0 md:backdrop-blur-none"
    >
      <ul ref={listRef} className="relative flex gap-2 overflow-x-auto [scrollbar-width:none] md:flex-col md:gap-4 md:overflow-visible">
        {items.map((item) => {
          const isActive = item.slug === active;
          return (
            <li key={item.slug} className="shrink-0">
              <a
                href={`#${item.slug}`}
                data-slug={item.slug}
                aria-current={isActive ? "true" : undefined}
                onClick={(event) => onSelect(event, item.slug)}
                className={`${itemBase} ${isActive ? itemActive : itemIdle}`}
              >
                <span className="relative size-6 shrink-0">
                  {isActive ? (
                    <PortalIcon name="target-active" className="absolute -top-1 -left-1 max-w-none" />
                  ) : (
                    <PortalIcon name="target" />
                  )}
                </span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
