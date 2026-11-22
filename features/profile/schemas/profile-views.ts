import type { HeroTier } from "@/features/hero-badges/schemas/hero-tier";
import type { KudoCardView } from "@/features/kudos-feed/schemas/kudo-card-view";

/**
 * Client-safe DTOs of F012 Profile (types only, no server imports). Nothing here carries an email,
 * role or last login (security: card/profile DTOs whitelist their fields), and Kudo cards only ever
 * arrive as phase 05 `KudoCardView`s (masked by `maskKudoRow`).
 */
export const PROFILE_KUDOS_DIRECTIONS = ["received", "sent"] as const;

export type ProfileKudosDirection = (typeof PROFILE_KUDOS_DIRECTIONS)[number];

/**
 * BR-006: each number equals what paginating that list to the end shows the viewer. `sent` (public
 * sent + the viewer's own spam, D006) exists only on the viewer's own profile (FR-603).
 */
export type ProfileKudoCounts = { received: number; sent?: number };

/** One page of GET /api/profile/{userId}/kudos (and the first page the server renders). */
export type ProfileKudosPage = { items: KudoCardView[]; nextCursor?: string; counts: ProfileKudoCounts };

/** Header of a profile page: department code under the name; the name of the department is localized. */
export type ProfileView = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  department: { code: string; name: string } | null;
};

/**
 * 200 body of GET /api/sunners/{userId}/card — the avatar hover card (Figma 2268:35101). The counts
 * follow decision 2026-11-23: `kudosSent` of someone else leaves out anonymous kudos; spam never
 * counts. `canSendKudo` = not the viewer's own card and writing still open.
 */
export type SunnerCardView = {
  id: string;
  fullName: string;
  departmentName: string | null;
  heroTier: HeroTier | null;
  kudosReceived: number;
  kudosSent: number;
  canSendKudo: boolean;
};
