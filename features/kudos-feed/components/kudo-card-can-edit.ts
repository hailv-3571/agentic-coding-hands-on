/**
 * Whether a feed card shows the owner's pen (F007 FR-303, decision-log 2026-11-16): the author
 * only, never on their own spam Kudo, and only while writing is open (`EVENT_END_AT`). The server
 * still answers WRITING_CLOSED on save; this decides what the card shows.
 */
export function kudoCardCanEdit({ isOwner, isSpam, writingOpen }: { isOwner: boolean; isSpam: boolean; writingOpen: boolean }): boolean {
  return isOwner && !isSpam && writingOpen;
}
