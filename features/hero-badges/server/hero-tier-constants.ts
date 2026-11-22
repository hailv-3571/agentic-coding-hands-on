/**
 * The ONE place the Hero thresholds live (F009 § 4.6, ALG-001): minimum distinct senders per tier,
 * lower bounds inclusive. Not env: nothing changes them at runtime. `tierFromCount` (phase 13),
 * `tierCountRange` (phase 14 Level filter) and the batch query all read these.
 */
export const HERO_NEW_MIN = 1;
export const HERO_RISING_MIN = 5;
export const HERO_SUPER_MIN = 10;
export const HERO_LEGEND_MIN = 21;

/** Ids per tier query; a longer batch is split into chunks of this size (one statement each). */
export const HERO_QUERY_MAX_IDS = 500;
