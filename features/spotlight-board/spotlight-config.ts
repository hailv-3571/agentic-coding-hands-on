/**
 * Phase 11 (F008) Spotlight Board constants shared by the server (snapshot query, migration
 * `*_spotlight_realtime.sql`) and the browser channel. Client-safe (no server imports). Spec
 * technical-spec § 4.6; D001/D006 defaults until BTC confirms. UI-only tuning (tiers, fonts,
 * debounce, ticker lines) lives in lib/spotlight-ui-config.ts.
 */

/** D001: names in the cloud, top N by public kudo count then recipient id. */
export const NAME_CLOUD_MAX = 60;

/** D006: most recent public kudos preloaded into the ticker on first load and on every refetch. */
export const TICKER_HISTORY_ON_LOAD = 5;

/**
 * INT-001 / D007: private Broadcast topic and event. The trigger in `*_spotlight_realtime.sql`
 * hard-codes the same literals ('spotlight', 'kudo'); the trigger integration test pins them equal.
 */
export const SPOTLIGHT_TOPIC = "spotlight";
export const SPOTLIGHT_EVENT = "kudo";
