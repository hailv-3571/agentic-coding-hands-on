"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isRouteActive } from "@/shared/ui/app-routes";
import type { NavItem } from "../types";
import { focusRing, textGlow } from "./shell-styles";

type NavLinksProps = {
  items: NavItem[];
  label: string;
  /** Stack the links (mobile panel) instead of laying them out in a row. */
  vertical?: boolean;
  /** Called after a link is chosen, e.g. to close the mobile panel. */
  onNavigate?: () => void;
  className?: string;
};

// Text colour is NOT in the base: `text-text` and `text-primary` on one element tie, and the
// CSS order (not the class order) picks the winner, which rendered active links white.
const linkBase = `relative inline-flex items-center rounded px-4 py-3 text-title-small transition-colors hover:bg-secondary ${focusRing}`;
const linkIdle = "text-text";
const linkActiveRow = `text-primary ${textGlow} after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-text`;
const linkActiveStack = `bg-secondary text-primary ${textGlow}`;

/** Navigation links with active-state by pathname (client: only this part needs `usePathname`). */
export function NavLinks({ items, label, vertical = false, onNavigate, className = "" }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className={className}>
      <ul className={vertical ? "flex flex-col gap-1" : "flex items-center gap-2 lg:gap-6"}>
        {items.map((item) => {
          const active = isRouteActive(pathname, item.href);
          const activeClass = vertical ? linkActiveStack : linkActiveRow;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={`${linkBase} ${vertical ? "w-full" : ""} ${active ? activeClass : linkIdle}`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
