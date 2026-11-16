import { KudoHeartButton } from "@/features/kudos-hearts/components/kudo-heart-button";

export type KudoCardHeartSlotProps = {
  kudoId: string;
  heartCount: number;
  heartedByMe: boolean;
  /** The viewer sent this Kudo: the heart is disabled with the reason (F005 DEC-001). */
  isOwner: boolean;
  /** `isKudoWritingOpen()`: false from EVENT_END_AT, when hearts become read-only. */
  writingOpen: boolean;
  /** Card: gap 4 (Figma 3127:21871); detail panel: gap 8 (520:18779). */
  variant: "card" | "detail";
};

/**
 * Heart area of the feed / Highlight card and the detail panel (seam handed over by phase 05,
 * rewritten by phase 06): the F005 heart toggle with its optimistic raw count. Spam cards never
 * render it (the card hides hearts for the owner's own spam Kudo).
 */
export function KudoCardHeartSlot(props: KudoCardHeartSlotProps) {
  return <KudoHeartButton {...props} />;
}
