/**
 * One row of Admin › Review content (F007). ADMIN-ONLY DTO: it carries the real sender of an
 * anonymous Kudo (C-13, decision-log "Admin thấy người gửi thật … kèm nhãn Ẩn danh"), so it is
 * built only by `KudoAdminQuery` behind `requireAdmin()` and must never be reused by a public
 * read path (those use `KudoCardView` from kudos-feed). Client-safe: types only.
 */

export type AdminKudoStatus = "public" | "spam";

export type AdminKudoPerson = { id: string; name: string; email: string };

export type AdminKudoRow = {
  id: string;
  /** First 8 characters of the uuid, shown in the ID column (D011). */
  shortId: string;
  /** ISO instant. */
  createdAt: string;
  /** Always the real sender, also for anonymous Kudos. */
  sender: AdminKudoPerson;
  isAnonymous: boolean;
  anonymousNickname: string | null;
  receiver: AdminKudoPerson;
  title: string | null;
  /** Stored Markdown source (phase 04 subset); the table shows it as plain, clamped text. */
  message: string;
  /** Localized labels, already prefixed with "#". */
  hashtags: string[];
  /** Raw count, no x2 (D010). */
  heartCount: number;
  status: AdminKudoStatus;
  moderatedBy: { id: string; name: string } | null;
  /** ISO instant, null until the first moderation. */
  moderatedAt: string | null;
};

export type AdminKudoPage = {
  rows: AdminKudoRow[];
  total: number;
  /** 1-based, already clamped to [1, pageCount]. */
  page: number;
  pageCount: number;
};

/** URL search-param names shared by the page, the JSON route and the CSV export (BR-002). */
export const ADMIN_KUDO_PARAMS = {
  page: "page",
  sort: "sort",
  status: "status",
  sender: "sender",
  receiver: "receiver",
  from: "from",
  to: "to",
  query: "q",
} as const;

/** `newest` = created_at DESC, id DESC (default); heart sorts break ties by id DESC. */
export type AdminKudoSort = "newest" | "hearts_desc" | "hearts_asc";

/** Parsed filter values as the screen shows them (dates `yyyy-MM-dd` in ADMIN_TIMEZONE). */
export type AdminKudoFilterValues = {
  page: number;
  sort: AdminKudoSort;
  status: AdminKudoStatus | null;
  senderId: string | null;
  receiverId: string | null;
  from: string | null;
  to: string | null;
  query: string;
};

/**
 * Props of `ReviewContentScreen` (features/admin-moderation/components/review-content-screen.tsx),
 * rendered by app/admin/review/page.tsx. `filterError` is set when the URL params were invalid
 * (e.g. reversed date range): the screen shows the message and `data` holds the unfiltered page 1.
 * `loadError` is set when the query failed: the screen shows the error state with a retry.
 */
export type ReviewContentScreenProps = {
  data: AdminKudoPage;
  filter: AdminKudoFilterValues;
  /** Display info for the selected Sender/Receiver filters (names for the select labels). */
  selectedSender: AdminKudoPerson | null;
  selectedReceiver: AdminKudoPerson | null;
  filterError: "invalid_date_range" | "invalid_params" | null;
  loadError: boolean;
};
