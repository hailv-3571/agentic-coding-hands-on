import type { SunnerOption } from "@/features/sunner-search/schemas/sunner-option";

/** One selectable hashtag, label already localized (GET /api/hashtags). */
export type HashtagOption = { id: string; label: string };

/** An image already attached to the Kudo; `previewUrl` is a short-lived signed read URL (or null). */
export type KudoImagePrefill = { path: string; position: number; previewUrl: string | null };

/**
 * 200 body of GET /api/kudos/{id}/edit (owner only), used to open the composer in edit mode.
 * `hashtags` lists the attached hashtags that are still active (an inactive one must be re-picked).
 * `locked` is true for a spam Kudo: the modal shows a read-only notice and saving returns SPAM_LOCKED.
 */
export type KudoEditPrefill = {
  id: string;
  recipient: SunnerOption;
  title: string | null;
  body: string;
  hashtags: HashtagOption[];
  images: KudoImagePrefill[];
  isAnonymous: boolean;
  anonymousNickname: string | null;
  locked: boolean;
};
