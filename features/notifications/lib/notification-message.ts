import type { NotificationView } from "../schemas/notification-views";

/** A root-level next-intl translator (`useTranslations()` / `createTranslator`): full keys. */
export type NotificationTranslator = (key: string, values?: Record<string, string | number>) => string;

const KEY = "notifications.types";

/**
 * Sender part of a "kudo_received" row. Anonymous wins: a nickname is shown as "<nickname> (ẩn
 * danh)" and a real name is never used next to it, even if one were present by mistake; with
 * neither, the nameless anonymous copy (D014). The server sends `actorName` only for a
 * non-anonymous sender (contract `NotificationView`).
 */
function kudoReceived(params: NotificationView["params"], t: NotificationTranslator): string {
  if (params.anonymousNickname) return t(`${KEY}.kudo_received.anonymous`, { nickname: params.anonymousNickname });
  if (params.actorName) return t(`${KEY}.kudo_received.named`, { name: params.actorName });
  return t(`${KEY}.kudo_received.anonymousUnnamed`);
}

/**
 * Localized text of one notification, one string per visual line (copy is never stored, BR-010:
 * the row holds `type` + `params`, so a locale switch re-renders old rows). Pure: the caller hands
 * in the translator. Tier names reuse phase 09's `hero.<tier>.label`.
 */
export function formatNotificationMessage(
  { type, params }: Pick<NotificationView, "type" | "params">,
  t: NotificationTranslator,
): string[] {
  switch (type) {
    case "kudo_received":
      return [kudoReceived(params, t)];
    case "heart_received":
      return [t(`${KEY}.heart_received`, { name: params.recipientName ?? "", count: params.count ?? 1 })];
    case "secret_box_granted":
      return [t(`${KEY}.secret_box_granted`)];
    case "hero_tier_up": {
      const tier = params.tier ? t(`hero.${params.tier}.label`) : "Hero";
      return [
        t(`${KEY}.hero_tier_up.main`, { count: params.senderCount ?? 0, tier }),
        t(`${KEY}.hero_tier_up.encouragement`),
      ];
    }
    case "kudo_hidden_spam":
      return [t(`${KEY}.kudo_hidden_spam`)];
    case "icon_set_completed":
      return [t(`${KEY}.icon_set_completed`, { gift: params.giftName ?? "" })];
    case "national_kudos":
      return [
        typeof params.rank === "number"
          ? t(`${KEY}.national_kudos.ranked`, { rank: params.rank })
          : t(`${KEY}.national_kudos.plain`),
      ];
  }
}
