"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { KudoComposerModal } from "@/features/kudos-authoring/components/kudo-composer-modal";
import { DocumentBodyPortal } from "./document-body-portal";
import { KudoFeedIcon } from "./kudo-feed-icon";
import { focusRing } from "./kudo-feed-styles";

/**
 * The owner's pen on a card (E22, Figma ic-pen-dark 32 at the right end of the title row). Opens
 * the phase 04 composer in edit mode; the edit route re-checks ownership and the spam lock. The
 * modal mounts on first use (the body portal needs `document`). Its "Đã lưu thay đổi." toast lives
 * in the layout's `KudoComposerToastHost`, not in this card, so the feed remount that the save's
 * refresh can cause does not cut it short. Render it only for `isOwner && !isSpam`
 * (server-computed) while writing is open (`KudoCard`'s `writingOpen`).
 */
export function KudoOwnerEditButton({ kudoId }: { kudoId: string }) {
  const t = useTranslations("kudosFeed.card");
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={t("edit")}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className={`flex size-8 shrink-0 items-center justify-center rounded transition-colors hover:bg-primary/40 ${focusRing}`}
      >
        <KudoFeedIcon name="pen-dark" />
      </button>
      {mounted && (
        <DocumentBodyPortal>
          <KudoComposerModal mode="edit" kudoId={kudoId} open={open} onOpenChange={setOpen} />
        </DocumentBodyPortal>
      )}
    </>
  );
}
