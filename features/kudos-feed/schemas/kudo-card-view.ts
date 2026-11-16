/**
 * The ONE Kudo card DTO that leaves the server (feed, Highlight, detail; phase 12 profile).
 * Built only by `maskKudoRow` (server/kudo-row-mask.ts): an anonymous Kudo carries no sender id,
 * name, email, avatar, department or Hero tier — only `{ anonymous: true, nickname }` (FR-602,
 * BR-003). Client-safe: types only, no server imports.
 */

/** Hero tier names (phase 09 `HeroTier`); phase 05 always sends `null` (seam default). */
export type KudoHeroTier = "new" | "rising" | "super" | "legend";

/** The card shows the department code (CEVC1…), Figma 3127:21871. */
export type KudoDepartmentView = { id: string; code: string };

/** A named Sunner on a card (recipient, or a non-anonymous sender). Links to `/profile/{id}`. */
export type KudoPersonView = {
  id: string;
  name: string;
  avatarUrl: string | null;
  department: KudoDepartmentView | null;
  tier: KudoHeroTier | null;
};

/** Anonymous sender: nickname only (decision-log 2026-11-15), no profile link, no badge. */
export type KudoAnonymousSenderView = { anonymous: true; nickname: string };

export type KudoSenderView = ({ anonymous: false } & KudoPersonView) | KudoAnonymousSenderView;

/** Localized label, already prefixed with `#` by the seed list (e.g. "#BE A TEAM"). */
export type KudoCardHashtag = { id: string; label: string };

/** Signed read URL of a private `kudo-images` object (short-lived); null when signing failed. */
export type KudoCardImage = { position: number; url: string | null };

/** Everything except the heart numbers: what the mask builds and the hero seam enriches. */
export type KudoCardCore = {
  id: string;
  sender: KudoSenderView;
  recipient: KudoPersonView;
  /** Danh hiệu (optional, ≤ 50). */
  title: string | null;
  /** Raw restricted Markdown: render with `parseKudoBody` (features/kudos-feed/markdown). */
  body: string;
  /** Seed order. */
  hashtags: KudoCardHashtag[];
  /** Position order 0..4. */
  images: KudoCardImage[];
  /** ISO 8601 UTC, millisecond precision. Display as `HH:mm - MM/DD/YYYY` in Asia/Ho_Chi_Minh. */
  createdAt: string;
  /** Server-computed: the viewer sent this Kudo (also true for their own anonymous Kudo). */
  isOwner: boolean;
  /** Only ever true for the viewer's own spam Kudo (owner-only read-only view, C-17). */
  isSpam: boolean;
};

/** Heart numbers from the phase 06 seam (phase 05 default: 0 / false). */
export type KudoHeartSummary = { heartCount: number; heartedByMe: boolean };

export type KudoCardView = KudoCardCore & KudoHeartSummary;
