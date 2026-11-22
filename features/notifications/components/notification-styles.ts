import { focusRing } from "@/features/app-shell/components/shell-styles";

/**
 * Class strings of the notification panel and page (Figma 589:9152 / 589:9132, tokens only):
 * surface Details/Container 2 (#00070C), rounded 16, px16 py8, gap 8; rows divided by #2E3940.
 */
export const notificationSurface = "flex flex-col gap-2 rounded-2xl bg-container-2 px-4 py-2";

/** Title row: "Thông báo" Bold 24/32 white on the left, actions on the right. */
export const notificationTitleRow = "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2";
export const notificationTitle = "text-headline-small font-bold whitespace-nowrap text-text";

/** "Xem tất cả" / "Đánh dấu đọc tất cả": Bold 16/24 white text buttons with a gold hover (never wrap; the row wraps). */
export const notificationTextAction = `ml-auto inline-flex items-center gap-2 rounded px-2 py-2 whitespace-nowrap text-title-medium font-bold text-text transition-colors hover:text-primary aria-disabled:cursor-wait aria-disabled:opacity-60 ${focusRing}`;

/** 40 px icon button (mark all read in the panel). */
export const notificationIconAction = `inline-flex size-10 items-center justify-center rounded transition-colors hover:bg-secondary aria-disabled:cursor-wait aria-disabled:opacity-60 ${focusRing}`;

/** Status lines (empty, loading, error) inside the list. */
export const notificationStatusText = "text-body-large text-text-muted";

/** Small retry button. */
export const notificationRetryButton = `rounded border border-border px-4 py-2 text-title-small font-bold text-text transition-colors hover:bg-secondary ${focusRing}`;
