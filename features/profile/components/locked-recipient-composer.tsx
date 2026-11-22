"use client";

import { KudoComposerModal } from "@/features/kudos-authoring/components/kudo-composer-modal";
import { DocumentBodyPortal } from "@/features/kudos-feed/components/document-body-portal";
import { invalidateSunnerCard } from "../lib/sunner-card-cache";

type LockedRecipientComposerProps = {
  recipient: { id: string; fullName: string };
  open: boolean;
  onOpenChange(open: boolean): void;
};

/**
 * The phase 04 composer in create mode with the recipient prefilled and locked (C-07, D008): the
 * profile's "Gửi lời cảm ơn…" pill and the hover card's "Gửi KUDO". A locked recipient is only shown
 * by name and sent by id, so the profile never needs the email the search option type carries (the
 * profile DTOs have none). Mount it after a user action only (body portal: it needs `document`),
 * then keep it mounted so the "sent" toast survives the close. A sent Kudo drops the recipient's
 * cached hover card, so its next open shows the new count (review W2).
 */
export function LockedRecipientComposer({ recipient, open, onOpenChange }: LockedRecipientComposerProps) {
  return (
    <DocumentBodyPortal>
      <KudoComposerModal
        mode="create"
        recipient={{ id: recipient.id, fullName: recipient.fullName, email: "", avatarUrl: null, department: null }}
        lockRecipient
        open={open}
        onOpenChange={onOpenChange}
        onSaved={() => invalidateSunnerCard(recipient.id)}
      />
    </DocumentBodyPortal>
  );
}
