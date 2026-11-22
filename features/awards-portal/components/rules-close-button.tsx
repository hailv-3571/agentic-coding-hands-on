"use client";

import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import { PortalIcon } from "./portal-icon";
import { smallSecondaryButton } from "./portal-styles";

type NavigationLike = { currentEntry?: { index: number } | null };

/**
 * True when the previous history entry is a page of this site. The Navigation API lists only
 * same-origin entries, so `currentEntry.index > 0` answers it; browsers without it fall back to a
 * same-origin `document.referrer`.
 */
function hasSameOriginHistory(): boolean {
  const navigation = (window as { navigation?: NavigationLike }).navigation;
  if (navigation?.currentEntry) return navigation.currentEntry.index > 0;
  try {
    return window.history.length > 1 && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Thể lệ "Đóng" (Figma 3204:6052): back to the previous page of the site, else the Homepage. */
export function RulesCloseButton({ label }: { label: string }) {
  const router = useRouter();
  const close = () => {
    if (hasSameOriginHistory()) router.back();
    else router.push(APP_ROUTES.home);
  };
  return (
    <button type="button" onClick={close} className={smallSecondaryButton}>
      <PortalIcon name="close" />
      {label}
    </button>
  );
}
