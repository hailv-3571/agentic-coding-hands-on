import "server-only";
import type {
  KudoCardCore,
  KudoCardHashtag,
  KudoCardImage,
  KudoDepartmentView,
  KudoSenderView,
} from "../schemas/kudo-card-view";
import type { KudoPublicRow } from "./kudo-public-select";

/**
 * FR-602 / BR-003 security boundary. Drizzle runs as a server role and bypasses RLS (C-20), so
 * this mapper — not the UI, not RLS — decides what of a Kudo row may leave the server. It builds
 * the card from an explicit whitelist (never spreads the row). For an anonymous Kudo the sender
 * becomes `{ anonymous: true, nickname }`: no id, name, avatar, department or tier. `isOwner` is
 * the only ownership signal, so an anonymous owner still gets their edit button. Admins get no
 * special treatment here (the real sender is shown only by phase 08's admin query).
 */
export type KudoCardRelations = { hashtags: KudoCardHashtag[]; images: KudoCardImage[] };

function departmentView(id: string | null, code: string | null): KudoDepartmentView | null {
  return id && code ? { id, code } : null;
}

function senderView(row: KudoPublicRow): KudoSenderView {
  if (row.isAnonymous) {
    // The DB CHECK guarantees a nickname for anonymous rows; "" only satisfies the type.
    return { anonymous: true, nickname: row.anonymousNickname ?? "" };
  }
  return {
    anonymous: false,
    id: row.senderId,
    name: row.senderName,
    avatarUrl: row.senderAvatarUrl,
    department: departmentView(row.senderDepartmentId, row.senderDepartmentCode),
    tier: null,
  };
}

export function maskKudoRow(row: KudoPublicRow, viewerId: string, related: KudoCardRelations): KudoCardCore {
  return {
    id: row.id,
    sender: senderView(row),
    recipient: {
      id: row.recipientId,
      name: row.recipientName,
      avatarUrl: row.recipientAvatarUrl,
      department: departmentView(row.recipientDepartmentId, row.recipientDepartmentCode),
      tier: null,
    },
    title: row.title,
    body: row.body,
    hashtags: related.hashtags,
    images: related.images,
    createdAt: row.createdAt.toISOString(),
    isOwner: row.senderId === viewerId,
    isSpam: row.status === "spam",
  };
}
