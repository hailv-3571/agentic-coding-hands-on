import "server-only";
import { findSunnerOptionsByIds } from "@/features/sunner-search/server/sunner-search-query";
import type { Locale } from "@/shared/i18n/locales";
import type { AdminKudoFilterValues, AdminKudoPerson } from "../schemas/admin-kudo-row";

/**
 * Display info for the Sender / Receiver filter selects of Admin › Review content: the URL only holds
 * ids, the selects show the name (and email). Reuses the phase 04 SunnerSearch lookup by id (C-06).
 * An id that matches no profile resolves to null.
 */
export type SelectedPeople = { selectedSender: AdminKudoPerson | null; selectedReceiver: AdminKudoPerson | null };

export async function resolveSelectedPeople(
  filter: Pick<AdminKudoFilterValues, "senderId" | "receiverId">,
  locale: Locale,
): Promise<SelectedPeople> {
  const ids = [...new Set([filter.senderId, filter.receiverId].filter((id): id is string => id !== null))];
  const options = ids.length === 0 ? [] : await findSunnerOptionsByIds(ids, locale);
  const people = new Map(options.map((option) => [option.id, { id: option.id, name: option.fullName, email: option.email }]));
  const personOf = (id: string | null) => (id ? (people.get(id) ?? null) : null);
  return { selectedSender: personOf(filter.senderId), selectedReceiver: personOf(filter.receiverId) };
}
