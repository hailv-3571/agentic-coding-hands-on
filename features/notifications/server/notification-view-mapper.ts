import { HERO_TIERS, type HeroTier } from "@/features/hero-badges/schemas/hero-tier";
import { APP_ROUTES } from "@/shared/ui/app-routes";
import type { NotificationType, NotificationView } from "../schemas/notification-views";

/**
 * One stored row plus the names the list query joined FRESH at read time (never copied into the row).
 * The query already applies the anonymity rule from the kudo's CURRENT state: `actorName` is null for a
 * kudo that is anonymous now, `anonymousNickname` is null for one that is not.
 */
export type NotificationListRow = {
  id: string;
  type: NotificationType;
  /** ISO instant, millisecond precision. */
  occurredAt: string;
  readAt: string | null;
  count: number;
  params: Record<string, unknown>;
  actorName: string | null;
  anonymousNickname: string | null;
  kudoRecipientName: string | null;
};

type ViewParams = NotificationView["params"];

const asString = (value: unknown): string | undefined => (typeof value === "string" && value.length > 0 ? value : undefined);
const asNumber = (value: unknown): number | undefined => (typeof value === "number" && Number.isFinite(value) ? value : undefined);
const asTier = (value: unknown): HeroTier | undefined => (HERO_TIERS as readonly unknown[]).includes(value) ? (value as HeroTier) : undefined;

/** `items` of a national_kudos row, best (lowest) rank first as written by the processor. */
function topNationalItem(params: Record<string, unknown>): { kudoId?: string; rank?: number } {
  const [first] = Array.isArray(params.items) ? (params.items as Record<string, unknown>[]) : [];
  return { kudoId: asString(first?.kudoId), rank: asNumber(first?.rank) };
}

const kudoHref = (kudoId: string | undefined) => (kudoId ? `${APP_ROUTES.kudos}/${encodeURIComponent(kudoId)}` : APP_ROUTES.kudos);

/**
 * ALG-003 with the Figma destinations (research/figma-notifications-spec.md): kudo types → kudo detail
 * (the owner still sees their own hidden kudo there; the inline "Tiêu chuẩn cộng đồng" link is UI
 * copy), Secret Box → the open-box deep link of phase 10 (`SECRET_BOX_DEEP_LINK_PARAM`), tier-up and
 * icon set → own profile, national kudos → the sender's top-ranked kudo.
 */
function hrefOf(type: NotificationType, params: Record<string, unknown>): string {
  switch (type) {
    case "kudo_received":
    case "heart_received":
    case "kudo_hidden_spam":
      return kudoHref(asString(params.kudoId));
    case "secret_box_granted":
      return `${APP_ROUTES.kudos}?secretBox=open`;
    case "hero_tier_up":
    case "icon_set_completed":
      return APP_ROUTES.profile;
    case "national_kudos":
      return kudoHref(topNationalItem(params).kudoId);
  }
}

/** Drops undefined keys so the JSON carries only what the type's copy interpolates. */
const compact = (params: ViewParams): ViewParams =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined)) as ViewParams;

function paramsOf(row: NotificationListRow): ViewParams {
  switch (row.type) {
    case "kudo_received":
      // BR-006: an anonymous kudo yields its nickname only, never a name next to it.
      return row.anonymousNickname ? { anonymousNickname: row.anonymousNickname } : compact({ actorName: row.actorName ?? undefined });
    case "heart_received":
      return compact({ recipientName: row.kudoRecipientName ?? undefined, count: row.count });
    case "hero_tier_up":
      return compact({ senderCount: asNumber(row.params.senderCount), tier: asTier(row.params.tier) });
    case "icon_set_completed":
      return compact({ giftName: asString(row.params.giftName) });
    case "national_kudos":
      return compact({ rank: topNationalItem(row.params).rank });
    case "secret_box_granted":
    case "kudo_hidden_spam":
      return {};
  }
}

export function toNotificationView(row: NotificationListRow): NotificationView {
  return {
    id: row.id,
    type: row.type,
    occurredAt: row.occurredAt,
    read: row.readAt !== null,
    href: hrefOf(row.type, row.params),
    params: paramsOf(row),
  };
}
