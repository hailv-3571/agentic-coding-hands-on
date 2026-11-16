import type { ReactNode } from "react";
import type { KudoCardHashtag } from "../schemas/kudo-card-view";
import { formatKudoCardTime } from "./format-kudo-card-time";

/** Send time "10:00 - 10/30/2025": Bold 16/24, tracking .5, #999 (machine-readable `datetime`). */
export function KudoCardTime({ createdAt }: { createdAt: string }) {
  return (
    <time dateTime={createdAt} className="text-body-large font-bold text-text-muted">
      {formatKudoCardTime(createdAt)}
    </time>
  );
}

/**
 * Title row: the Danh hiệu centred over the full width (uppercase, Bold 16/24, tracking .5) with
 * an optional action (the owner's pen) at the right end. Hidden when there is neither. `heading`
 * follows the page outline: h3 under a section's h2 (feed, Highlight), h2 under the detail h1.
 */
export function KudoCardTitleRow({ title, action, heading: Heading = "h3" }: { title: string | null; action?: ReactNode; heading?: "h2" | "h3" }) {
  if (!title && !action) return null;
  return (
    <div className="relative flex min-h-8 items-center justify-center">
      {title && <Heading className="px-10 text-center text-body-large font-bold wrap-anywhere text-on-primary uppercase">{title}</Heading>}
      {action && <div className="absolute top-1/2 right-0 -translate-y-1/2">{action}</div>}
    </div>
  );
}

const hashtagClamp = { 1: "line-clamp-1", 2: "line-clamp-2", all: "" } as const;

/** Hashtags "#Name #Name…": Bold 16/24, tracking .5, red; clamped with an ellipsis on cards. */
export function KudoCardHashtags({ hashtags, lines }: { hashtags: KudoCardHashtag[]; lines: keyof typeof hashtagClamp }) {
  if (hashtags.length === 0) return null;
  return (
    <p className={`text-body-large font-bold break-words text-error ${hashtagClamp[lines]}`}>
      {hashtags.map((tag) => tag.label).join(" ")}
    </p>
  );
}
