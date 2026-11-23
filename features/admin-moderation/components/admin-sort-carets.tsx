import { AdminModerationIcon } from "./admin-moderation-icon";

/**
 * Up/down carets of a sortable admin header (Figma sorter, Review content Heart and the Admin ›
 * User columns): the active direction is lit, the other dimmed. Decorative — the header's
 * `aria-sort` carries the state.
 */
export function AdminSortCarets({ direction }: { direction: "asc" | "desc" | null }) {
  return (
    <span aria-hidden className="flex shrink-0 flex-col">
      <AdminModerationIcon name="sort-up" className={`-mb-0.5 ${direction === "asc" ? "brightness-200" : "opacity-40"}`} />
      <AdminModerationIcon name="sort-down" className={`-mt-0.5 ${direction === "desc" ? "brightness-200" : "opacity-40"}`} />
    </span>
  );
}
