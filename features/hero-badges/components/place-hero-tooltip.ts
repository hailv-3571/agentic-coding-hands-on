/** Distance kept from every viewport edge (the page's 16 px phone gutter) and from the badge. */
const VIEWPORT_GUTTER = 16;
const BADGE_GAP = 8;

type Box = { width: number; height: number };
type Anchor = Box & { left: number; top: number };

/**
 * Where the fixed Hero tooltip goes (viewport coordinates): 8 px under the badge and centred on it,
 * clamped 16 px inside the left/right edges (so it stays on a 375 px screen), flipped above the
 * badge only when it overflows the bottom edge and fits above. Pure, for the panel's layout effect.
 */
export function placeHeroTooltip(anchor: Anchor, panel: Box, viewport: Box): { left: number; top: number } {
  const centred = anchor.left + anchor.width / 2 - panel.width / 2;
  const left = Math.max(VIEWPORT_GUTTER, Math.min(centred, viewport.width - VIEWPORT_GUTTER - panel.width));
  const below = anchor.top + anchor.height + BADGE_GAP;
  const above = anchor.top - BADGE_GAP - panel.height;
  const fitsBelow = below + panel.height <= viewport.height - VIEWPORT_GUTTER;
  return { left, top: fitsBelow || above < VIEWPORT_GUTTER ? below : above };
}
